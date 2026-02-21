package com.vibelog.routes

import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import com.vibelog.models.*
import com.vibelog.plugins.dbQuery
import com.vibelog.services.GeminiService
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.plus
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import java.util.*
import kotlinx.serialization.json.*

fun Route.searchRoutes(geminiService: GeminiService) {
    route("/search") {
        
        // AI 기반 자연어 검색 (Gemini 연동)
        get("/ai") {
            val q = call.request.queryParameters["q"] ?: return@get call.respond(HttpStatusCode.BadRequest, "Missing query")
            
            val dbPosts = dbQuery {
                Posts.selectAll().where { Posts.contentSummary.lowerCase() like "%${q.lowercase()}%" }
                    .limit(3)
                    .map { row ->
                        mapOf(
                            "id" to row[Posts.id].toString(),
                            "title" to row[Posts.title],
                            "summary" to row[Posts.contentSummary]
                        )
                    }
            }

            val context = if (dbPosts.isNotEmpty()) "우리 앱 유저들의 관련 여행 기록이야: $dbPosts" else ""
            val prompt = "$context\n\n사용자의 질문: '$q'\n위의 유저 기록들과 너의 지식을 합쳐서 최고의 답변을 줘. 추천 장소와 간단한 이유를 포함해줘."
            
            val answer = geminiService.generateText(prompt)
            call.respond(mapOf("answer" to answer, "related_posts" to dbPosts))
        }

        // 스마트 클로닝 (AI 파싱 - 텍스트를 JSON 일정으로 변환 + 클론 횟수 증가)
        post("/clone/{id}") {
            val postId = UUID.fromString(call.parameters["id"])
            
            val postSummary = dbQuery {
                Posts.selectAll().where { Posts.id eq postId }
                    .map { it[Posts.contentSummary] }
                    .singleOrNull()
            } ?: return@post call.respond(HttpStatusCode.NotFound, "Post not found")
            
            val jsonResult = geminiService.parseItinerary(postSummary)
            
            if (jsonResult != null) {
                // 클론 횟수 증가
                dbQuery {
                    Posts.update({ Posts.id eq postId }) { it[Posts.cloneCount] = Posts.cloneCount.plus(1) }
                }
                call.respond(jsonResult)
            } else {
                call.respond(HttpStatusCode.InternalServerError, "Failed to parse travel plan via AI")
            }
        }
    }
}
