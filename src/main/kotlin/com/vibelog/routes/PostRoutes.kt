package com.vibelog.routes

import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import com.vibelog.models.*
import com.vibelog.plugins.dbQuery
import org.jetbrains.exposed.sql.*
import java.util.*
import kotlinx.serialization.Serializable

@Serializable
data class PostCreateRequest(
    val travelId: String,
    val title: String,
    val photoIds: List<String>
)

fun Route.postRoutes() {
    route("/posts") {
        
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

        post {
            val userId = call.getUserIdFromHeader() ?: return@post call.respond(HttpStatusCode.Unauthorized, "Invalid User")
            val request = call.receive<PostCreateRequest>()
            val travelId = UUID.fromString(request.travelId)
            
            // 1. 여행 일정 데이터 조회
            val plans = dbQuery {
                TravelPlanItems.select { TravelPlanItems.travelId eq travelId }
                    .orderBy(TravelPlanItems.date to SortOrder.ASC)
                    .orderBy(TravelPlanItems.startTime to SortOrder.ASC)
                    .map { row ->
                        val date = row[TravelPlanItems.date]
                        val start = row[TravelPlanItems.startTime] ?: ""
                        val end = row[TravelPlanItems.endTime] ?: ""
                        val memo = row[TravelPlanItems.memo] ?: "일정"
                        "$date 일정\n- $start ~ $end : $memo"
                    }
            }
            
            val staticSummary = if (plans.isNotEmpty()) {
                plans.joinToString("\n")
            } else {
                "등록된 여행 일정이 없습니다."
            }

            val newPostId = dbQuery {
                val postId = Posts.insert {
                    it[Posts.travelId] = travelId
                    it[Posts.userId] = userId
                    it[Posts.title] = request.title
                    it[Posts.contentSummary] = staticSummary
                } get Posts.id
                
                request.photoIds.forEach { photoId ->
                    PostPhotoMappings.insert {
                        it[PostPhotoMappings.postId] = postId
                        it[PostPhotoMappings.photoId] = UUID.fromString(photoId)
                    }
                }
                postId
            }
            
            call.respond(HttpStatusCode.Created, mapOf("id" to newPostId.toString(), "summary" to staticSummary))
        }
    }
}
