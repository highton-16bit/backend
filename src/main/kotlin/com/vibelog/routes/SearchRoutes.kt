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

        // 지역 기반 검색 (짧은 쿼리: 전주, 부산 등)
        // GET /search?q=전주 → 해당 지역 인기 피드 + 지도 핀
        get {
            val q = call.request.queryParameters["q"]
                ?: return@get call.respond(HttpStatusCode.BadRequest, MessageResponse("Missing query"))

            // SQL Injection 방지
            val safeQuery = q.lowercase()
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_")

            // 지역명으로 여행 검색 후 관련 게시글 조회 (인기순)
            val postsWithLocation = dbQuery {
                (Posts innerJoin Travels)
                    .selectAll()
                    .where {
                        (Travels.regionName.lowerCase() like "%$safeQuery%") or
                        (Posts.title.lowerCase() like "%$safeQuery%") or
                        (Posts.contentSummary.lowerCase() like "%$safeQuery%")
                    }
                    .orderBy(Posts.likeCount to SortOrder.DESC)
                    .limit(20)
                    .map { row ->
                        val postId = row[Posts.id]
                        val travelId = row[Posts.travelId]

                        // 첫 번째 사진 및 좌표 조회
                        val firstPhoto = dbQuery {
                            (PostPhotoMappings innerJoin TravelPhotos)
                                .selectAll()
                                .where { PostPhotoMappings.postId eq postId }
                                .firstOrNull()
                        }

                        SearchPostItem(
                            id = postId.toString(),
                            title = row[Posts.title],
                            summary = row[Posts.contentSummary],
                            regionName = row[Travels.regionName],
                            latitude = firstPhoto?.get(TravelPhotos.latitude),
                            longitude = firstPhoto?.get(TravelPhotos.longitude),
                            likeCount = row[Posts.likeCount],
                            photoUrl = firstPhoto?.get(TravelPhotos.imageUrl)
                        )
                    }
            }

            // 좌표가 있는 게시글로 지도 핀 생성
            val mapPins = postsWithLocation
                .filter { it.latitude != null && it.longitude != null }
                .map { post ->
                    MapPin(
                        postId = post.id,
                        title = post.title,
                        latitude = post.latitude!!,
                        longitude = post.longitude!!,
                        photoUrl = post.photoUrl
                    )
                }

            // 매칭된 지역명 추출 (가장 많이 나온 지역)
            val matchedRegion = postsWithLocation
                .mapNotNull { it.regionName }
                .groupingBy { it }
                .eachCount()
                .maxByOrNull { it.value }
                ?.key

            call.respond(
                RegionSearchResponse(
                    query = q,
                    regionName = matchedRegion,
                    posts = postsWithLocation,
                    mapPins = mapPins
                )
            )
        }

        // AI 기반 자연어 검색 (상세 질문용)
        get("/ai") {
            val q = call.request.queryParameters["q"]
                ?: return@get call.respond(HttpStatusCode.BadRequest, MessageResponse("Missing query"))

            val safeQuery = q.lowercase()
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_")

            val relatedPosts = dbQuery {
                (Posts innerJoin Travels)
                    .selectAll()
                    .where {
                        (Travels.regionName.lowerCase() like "%$safeQuery%") or
                        (Posts.contentSummary.lowerCase() like "%$safeQuery%")
                    }
                    .orderBy(Posts.likeCount to SortOrder.DESC)
                    .limit(5)
                    .map { row ->
                        val postId = row[Posts.id]
                        val firstPhoto = dbQuery {
                            (PostPhotoMappings innerJoin TravelPhotos)
                                .selectAll()
                                .where { PostPhotoMappings.postId eq postId }
                                .firstOrNull()
                        }

                        SearchPostItem(
                            id = postId.toString(),
                            title = row[Posts.title],
                            summary = row[Posts.contentSummary],
                            regionName = row[Travels.regionName],
                            latitude = firstPhoto?.get(TravelPhotos.latitude),
                            longitude = firstPhoto?.get(TravelPhotos.longitude),
                            likeCount = row[Posts.likeCount],
                            photoUrl = firstPhoto?.get(TravelPhotos.imageUrl)
                        )
                    }
            }

            val context = if (relatedPosts.isNotEmpty()) {
                "우리 앱 유저들의 관련 여행 기록이야: ${relatedPosts.map { "${it.regionName ?: ""} ${it.title}: ${it.summary}" }}"
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

        // 지역별 인기 피드 조회
        get("/region/{regionName}") {
            val regionName = call.parameters["regionName"]
                ?: return@get call.respond(HttpStatusCode.BadRequest, MessageResponse("Missing region name"))

            val safeRegion = regionName.lowercase()
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_")

            val posts = dbQuery {
                (Posts innerJoin Travels)
                    .selectAll()
                    .where { Travels.regionName.lowerCase() like "%$safeRegion%" }
                    .orderBy(Posts.likeCount to SortOrder.DESC)
                    .limit(50)
                    .map { row ->
                        val postId = row[Posts.id]
                        val firstPhoto = dbQuery {
                            (PostPhotoMappings innerJoin TravelPhotos)
                                .selectAll()
                                .where { PostPhotoMappings.postId eq postId }
                                .firstOrNull()
                        }

                        SearchPostItem(
                            id = postId.toString(),
                            title = row[Posts.title],
                            summary = row[Posts.contentSummary],
                            regionName = row[Travels.regionName],
                            latitude = firstPhoto?.get(TravelPhotos.latitude),
                            longitude = firstPhoto?.get(TravelPhotos.longitude),
                            likeCount = row[Posts.likeCount],
                            photoUrl = firstPhoto?.get(TravelPhotos.imageUrl)
                        )
                    }
            }

            val mapPins = posts
                .filter { it.latitude != null && it.longitude != null }
                .map { post ->
                    MapPin(
                        postId = post.id,
                        title = post.title,
                        latitude = post.latitude!!,
                        longitude = post.longitude!!,
                        photoUrl = post.photoUrl
                    )
                }

            call.respond(
                RegionSearchResponse(
                    query = regionName,
                    regionName = regionName,
                    posts = posts,
                    mapPins = mapPins
                )
            )
        }

        // 스마트 클로닝 (게시글을 일정으로 변환)
        post("/clone/{postId}") {
            val userId = call.getUserId()
                ?: return@post call.respond(HttpStatusCode.Unauthorized, MessageResponse("Unauthorized"))

            val postId = call.parameters["postId"]?.toUuidOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, MessageResponse("Invalid Post ID"))

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

            val parsedJson = try {
                geminiService.parseItinerary(summary)
            } catch (e: Exception) {
                null
            }

            if (parsedJson == null) {
                return@post call.respond(HttpStatusCode.InternalServerError, MessageResponse("Failed to parse itinerary"))
            }

            val originalTravel = dbQuery {
                Travels.selectAll()
                    .where { Travels.id eq originalTravelId }
                    .singleOrNull()
            }

            val result = dbQuery {
                val newTravelId = Travels.insert {
                    it[Travels.userId] = userId
                    it[title] = originalTravel?.get(Travels.title)?.let { t -> "$t (클론)" } ?: "클론된 여행"
                    it[startDate] = originalTravel?.get(Travels.startDate) ?: LocalDate.parse("2025-01-01")
                    it[endDate] = originalTravel?.get(Travels.endDate) ?: LocalDate.parse("2025-01-01")
                    it[regionName] = originalTravel?.get(Travels.regionName)
                    it[isPublic] = false
                } get Travels.id

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
