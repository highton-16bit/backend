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
import org.jetbrains.exposed.sql.SqlExpressionBuilder.plus
import org.jetbrains.exposed.sql.SqlExpressionBuilder.ilike
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import java.util.*
import kotlinx.serialization.json.*

fun Route.searchRoutes(apiKey: String) {
    val client = HttpClient {
        install(ContentNegotiation) {
            json()
        }
    }

    route("/search") {
        
        get("/ai") {
            val q = call.request.queryParameters["q"] ?: return@get call.respond(HttpStatusCode.BadRequest, "Missing query")
            
            val dbPosts = dbQuery {
                Posts.selectAll().where { Posts.contentSummary.ilike("%$q%") }
                    .limit(3)
                    .map { row ->
                        mapOf(
                            "id" to row[Posts.id].toString(),
                            "title" to row[Posts.title],
                            "summary" to row[Posts.contentSummary]
                        )
                    }
            }

            if (apiKey.isNotEmpty()) {
                val context = if (dbPosts.isNotEmpty()) "우리 앱 유저들의 관련 여행 기록이야: $dbPosts" else ""
                val prompt = "$context\n\n사용자의 질문: '$q'\n위의 유저 기록들과 너의 지식을 합쳐서 최고의 답변을 줘. 추천 장소와 간단한 이유를 포함해줘."
                
                val response = client.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$apiKey") {
                    contentType(ContentType.Application.Json)
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

        // 스마트 클로닝 (AI 파싱 - 텍스트를 JSON 일정으로 변환 + 클론 횟수 증가)
        post("/clone/{id}") {
            val postId = UUID.fromString(call.parameters["id"])
            
                        val postSummary = dbQuery {
            
                            Posts.selectAll().where { Posts.id eq postId }
            
                                .map { it[Posts.contentSummary] }
            
                                .singleOrNull()
            
                        }
            
             ?: return@post call.respond(HttpStatusCode.NotFound, "Post not found")
            
            if (apiKey.isNotEmpty() && postSummary != null) {
                val prompt = """
                    다음 여행 요약글을 분석해서 일별 계획들을 추출해줘.
                    응답은 반드시 'planItems' 라는 키를 가진 JSON 객체여야 하며, 리스트 내 각 객체는 다음 필드를 가져야 해:
                    - date: 'YYYY-MM-DD' 형식
                    - startTime: 'HH:mm' 형식 또는 null
                    - endTime: 'HH:mm' 형식 또는 null
                    - memo: 일정의 핵심 내용 (장소나 활동 포함)

                    요약글:
                    $postSummary
                """.trimIndent()
                
                val response = client.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$apiKey") {
                    contentType(ContentType.Application.Json)
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
                    val jsonStart = parsedText.indexOf("{")
                    val jsonEnd = parsedText.lastIndexOf("}") + 1
                    val jsonResult = Json.parseToJsonElement(parsedText.substring(jsonStart, jsonEnd)).jsonObject
                    
                    // 클론 횟수 증가 (성공 시에만)
                    dbQuery {
                        Posts.update({ Posts.id eq postId }) { it[Posts.cloneCount] = Posts.cloneCount.plus(1) }
                    }
                    
                    call.respond(jsonResult)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Failed to parse travel plan via AI")
                }
            } else {
                call.respond(HttpStatusCode.BadRequest, "AI parsing unavailable")
            }
        }
    }
}
