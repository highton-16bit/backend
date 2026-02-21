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

fun Route.searchRoutes(apiKey: String) {
    val client = HttpClient {
        install(ContentNegotiation) {
            json()
        }
    }

    route("/search") {
        
        // AI 기반 통합 검색
        get("/ai") {
            val q = call.request.queryParameters["q"] ?: return@get call.respond(HttpStatusCode.BadRequest, "Missing query")
            
            // 1. 우리 DB에서 관련 게시글 검색 (단순 텍스트 검색)
            val dbPosts = dbQuery {
                Posts.select { Posts.contentSummary ilike "%$q%" }
                    .limit(3)
                    .map { row ->
                        mapOf(
                            "id" to row[Posts.id].toString(),
                            "title" to row[Posts.title],
                            "summary" to row[Posts.contentSummary]
                        )
                    }
            }

            // 2. Gemini에게 통합 답변 요청
            if (apiKey.isNotEmpty()) {
                val context = if (dbPosts.isNotEmpty()) "우리 앱 유저들의 관련 여행 기록이야: $dbPosts" else ""
                val prompt = "$context\n\n사용자의 질문: '$q'\n위의 유저 기록들과 너의 지식을 합쳐서 최고의 답변을 줘. 추천 장소와 간단한 이유를 포함해줘."
                
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
                val answer = body["candidates"]?.jsonArray?.get(0)?.jsonObject?.get("content")?.jsonObject?.get("parts")?.jsonArray?.get(0)?.jsonObject?.get("text")?.jsonPrimitive?.content ?: "AI 답변 생성 실패"
                
                call.respond(mapOf("answer" to answer, "related_posts" to dbPosts))
            } else {
                call.respond(HttpStatusCode.InternalServerError, "AI API Key is missing")
            }
        }

        // 스마트 클로닝 (AI 파싱)
        post("/clone/{id}") {
            val postId = UUID.fromString(call.parameters["id"])
            
            // 1. 원본 게시물 데이터 조회
            val postSummary = dbQuery {
                Posts.select { Posts.id eq postId }
                    .map { it[Posts.contentSummary] }
                    .singleOrNull()
            } ?: return@post call.respond(HttpStatusCode.NotFound, "Post not found")
            
            // 2. AI 파싱 (텍스트 -> JSON 일정)
            if (apiKey.isNotEmpty() && postSummary != null) {
                val prompt = """
                    다음 여행 요약글을 읽고 일별 계획(date, time, place_name, memo)을 추출해줘. 
                    응답은 반드시 JSON 리스트 형식이어야 해. 
                    날짜는 '2026-03-01' 형식, 시간은 'HH:mm' 또는 null로 해줘.
                    요약글: $postSummary
                """.trimIndent()
                
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
                val parsedText = body["candidates"]?.jsonArray?.get(0)?.jsonObject?.get("content")?.jsonObject?.get("parts")?.jsonArray?.get(0)?.jsonObject?.get("text")?.jsonPrimitive?.content ?: ""
                
                try {
                    val jsonStart = parsedText.indexOf("[")
                    val jsonEnd = parsedText.lastIndexOf("]") + 1
                    val jsonArray = Json.parseToJsonElement(parsedText.substring(jsonStart, jsonEnd)).jsonArray
                    call.respond(mapOf("parsed_plans" to jsonArray))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Failed to parse travel plan")
                }
            } else {
                call.respond(HttpStatusCode.BadRequest, "AI parsing unavailable")
            }
        }
    }
}
