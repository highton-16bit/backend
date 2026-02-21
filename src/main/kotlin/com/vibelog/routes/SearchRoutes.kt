package com.vibelog.routes

import com.vibelog.models.*
import com.vibelog.plugins.dbQuery
import com.vibelog.services.GeminiService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.datetime.LocalDate
import kotlinx.serialization.json.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.plus
import java.util.*

fun Route.searchRoutes(geminiService: GeminiService) {
    route("/search") {

        // AI 기반 자연어 검색
        get {
            val q = call.request.queryParameters["q"]
                ?: return@get call.respond(HttpStatusCode.BadRequest, MessageResponse("Missing query"))

            // SQL Injection 방지
            val safeQuery = q.lowercase()
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_")

            val relatedPosts = dbQuery {
                Posts.selectAll()
                    .where { Posts.contentSummary.lowerCase() like "%$safeQuery%" }
                    .limit(3)
                    .map { row ->
                        SearchPostItem(
                            id = row[Posts.id].toString(),
                            title = row[Posts.title],
                            summary = row[Posts.contentSummary]
                        )
                    }
            }

            val context = if (relatedPosts.isNotEmpty()) {
                "우리 앱 유저들의 관련 여행 기록이야: ${relatedPosts.map { "${it.title}: ${it.summary}" }}"
            } else ""

            val prompt = """
                $context

                사용자의 질문: '$q'
                위의 유저 기록들과 너의 지식을 합쳐서 최고의 답변을 줘. 추천 장소와 간단한 이유를 포함해줘.
            """.trimIndent()

            val answer = try {
                geminiService.generateText(prompt)
            } catch (e: Exception) {
                "AI 응답을 생성할 수 없습니다."
            }

            call.respond(AISearchResponse(query = q, answer = answer, relatedPosts = relatedPosts))
        }

        // 스마트 클로닝 (게시글을 일정으로 변환)
        post("/clone/{postId}") {
            val userId = call.getUserId()
                ?: return@post call.respond(HttpStatusCode.Unauthorized, MessageResponse("Unauthorized"))

            val postId = call.parameters["postId"]?.toUuidOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, MessageResponse("Invalid Post ID"))

            // 게시글 조회
            val postData = dbQuery {
                Posts.selectAll()
                    .where { Posts.id eq postId }
                    .map { row ->
                        Pair(row[Posts.travelId], row[Posts.contentSummary])
                    }
                    .singleOrNull()
            } ?: return@post call.respond(HttpStatusCode.NotFound, MessageResponse("Post not found"))

            val (originalTravelId, summary) = postData

            if (summary.isNullOrBlank()) {
                return@post call.respond(HttpStatusCode.BadRequest, MessageResponse("Post has no content to clone"))
            }

            // AI로 일정 파싱
            val parsedJson = try {
                geminiService.parseItinerary(summary)
            } catch (e: Exception) {
                null
            }

            if (parsedJson == null) {
                return@post call.respond(HttpStatusCode.InternalServerError, MessageResponse("Failed to parse itinerary"))
            }

            // 원본 여행 정보 조회
            val originalTravel = dbQuery {
                Travels.selectAll()
                    .where { Travels.id eq originalTravelId }
                    .singleOrNull()
            }

            // 새 여행 생성 및 일정 복사
            val result = dbQuery {
                // 새 여행 생성
                val newTravelId = Travels.insert {
                    it[Travels.userId] = userId
                    it[title] = originalTravel?.get(Travels.title)?.let { t -> "$t (클론)" } ?: "클론된 여행"
                    it[startDate] = originalTravel?.get(Travels.startDate) ?: LocalDate.parse("2025-01-01")
                    it[endDate] = originalTravel?.get(Travels.endDate) ?: LocalDate.parse("2025-01-01")
                    it[regionName] = originalTravel?.get(Travels.regionName)
                    it[isPublic] = false
                } get Travels.id

                // 파싱된 일정 저장
                val planItems = mutableListOf<PlanResponse>()
                val itemsArray = parsedJson["planItems"]?.jsonArray

                itemsArray?.forEachIndexed { index, item ->
                    val obj = item.jsonObject
                    val dateStr = obj["date"]?.jsonPrimitive?.contentOrNull
                    val startTimeStr = obj["startTime"]?.jsonPrimitive?.contentOrNull
                    val endTimeStr = obj["endTime"]?.jsonPrimitive?.contentOrNull
                    val memo = obj["memo"]?.jsonPrimitive?.contentOrNull

                    val date = try {
                        LocalDate.parse(dateStr ?: "2025-01-01")
                    } catch (e: Exception) {
                        LocalDate.parse("2025-01-01")
                    }

                    val newPlanId = TravelPlanItems.insert {
                        it[travelId] = newTravelId
                        it[TravelPlanItems.date] = date
                        it[TravelPlanItems.startTime] = startTimeStr
                        it[TravelPlanItems.endTime] = endTimeStr
                        it[TravelPlanItems.memo] = memo
                        it[orderIndex] = index
                    } get TravelPlanItems.id

                    planItems.add(
                        PlanResponse(
                            id = newPlanId.toString(),
                            date = date.toString(),
                            startTime = startTimeStr,
                            endTime = endTimeStr,
                            memo = memo
                        )
                    )
                }

                // 클론 횟수 증가
                Posts.update({ Posts.id eq postId }) {
                    it[cloneCount] = cloneCount plus 1
                }

                CloneResponse(travelId = newTravelId.toString(), planItems = planItems)
            }

            call.respond(HttpStatusCode.Created, result)
        }
    }
}

private fun String.toUuidOrNull(): UUID? = try {
    UUID.fromString(this)
} catch (e: Exception) {
    null
}
