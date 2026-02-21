package com.vibelog.routes

import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import com.vibelog.models.*
import com.vibelog.plugins.dbQuery
import org.jetbrains.exposed.sql.*
import java.util.*
import kotlinx.serialization.json.*

fun Route.postRoutes(apiKey: String) {
    val client = HttpClient {
        install(ContentNegotiation) {
            json()
        }
    }

    route("/posts") {
        
        // 피드 조회
        get {
            val posts = dbQuery {
                Posts.selectAll()
                    .orderBy(Posts.createdAt to SortOrder.DESC)
                    .map { row ->
                        mapOf(
                            "id" to row[Posts.id].toString(),
                            "title" to row[Posts.title],
                            "contentSummary" to row[Posts.contentSummary],
                            "likeCount" to row[Posts.likeCount],
                            "createdAt" to row[Posts.createdAt].toString()
                        )
                    }
            }
            call.respond(posts)
        }

        // 게시글 생성 (AI 요약 포함)
        post {
            val userId = call.getUserIdFromHeader() ?: return@post call.respond(HttpStatusCode.Unauthorized, "Invalid User")
            val request = call.receive<PostCreateRequest>()
            val travelId = UUID.fromString(request.travelId)
            
            // 1. 여행 계획 데이터 조회
            val plans = dbQuery {
                TravelPlanItems.select { TravelPlanItems.travelId eq travelId }
                    .orderBy(TravelPlanItems.date to SortOrder.ASC)
                    .map { row ->
                        mapOf(
                            "date" to row[TravelPlanItems.date].toString(),
                            "placeName" to row[TravelPlanItems.placeName],
                            "memo" to row[TravelPlanItems.memo]
                        )
                    }
            }
            
            // 2. AI 요약 (Gemini)
            var summary: String? = null
            if (apiKey.isNotEmpty() && plans.isNotEmpty()) {
                try {
                    val prompt = "다음은 한 여행의 일정 데이터야. 이 일정들을 기반으로 블로그 포스팅처럼 감성적이고 읽기 좋게 요약해줘: $plans"
                    val response = client.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$apiKey") {
                        contentType(ContentType.Application.JSON)
                        setBody(buildJsonObject {
                            putJsonArray("contents") {
                                addJsonObject {
                                    putJsonArray("parts") {
                                        addJsonObject { put("text", prompt) }
                                    }
                                }
                            }
                        })
                    }
                    val body = Json.parseToJsonElement(response.bodyAsText()).jsonObject
                    summary = body["candidates"]?.jsonArray?.get(0)?.jsonObject?.get("content")?.jsonObject?.get("parts")?.jsonArray?.get(0)?.jsonObject?.get("text")?.jsonPrimitive?.content
                } catch (e: Exception) {
                    println("AI 요약 실패: ${e.message}")
                }
            }

            // 3. 게시글 저장
            val newPostId = dbQuery {
                val postId = Posts.insert {
                    it[Posts.travelId] = travelId
                    it[Posts.userId] = userId
                    it[Posts.title] = request.title
                    it[Posts.contentSummary] = summary
                } get Posts.id
                
                request.photoIds.forEach { photoId ->
                    PostPhotoMappings.insert {
                        it[PostPhotoMappings.postId] = postId
                        it[PostPhotoMappings.photoId] = UUID.fromString(photoId)
                    }
                }
                postId
            }
            
            call.respond(HttpStatusCode.Created, mapOf("id" to newPostId.toString(), "summary" to summary))
        }
    }
}
