package com.vibelog.routes

import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import com.vibelog.models.*
import com.vibelog.plugins.dbQuery
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.plus
import org.jetbrains.exposed.sql.SqlExpressionBuilder.minus
import java.util.*
import kotlinx.datetime.LocalDate
import kotlinx.serialization.Serializable

@Serializable
data class PostCreateRequest(
    val travelId: String,
    val title: String,
    val photoIds: List<String>
)

fun Route.postRoutes() {
    route("/posts") {
        
        // 피드 조회 (좋아요, 클론 횟수 포함)
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
                            "cloneCount" to row[Posts.cloneCount],
                            "createdAt" to row[Posts.createdAt].toString()
                        )
                    }
            }
            call.respond(posts)
        }

        // 게시글 생성 (Static Flattening 반영)
        post {
            val userId = call.getUserIdFromHeader() ?: return@post call.respond(HttpStatusCode.Unauthorized, "Invalid User")
            val request = call.receive<PostCreateRequest>()
            val travelId = UUID.fromString(request.travelId)
            
            val plans = dbQuery {
                TravelPlanItems.selectAll().where { TravelPlanItems.travelId eq travelId }
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

        // 좋아요 토글 (Like/Unlike Toggle)
        post("/{id}/like") {
            val userId = call.getUserIdFromHeader() ?: return@post call.respond(HttpStatusCode.Unauthorized, "Invalid User")
            val postId = UUID.fromString(call.parameters["id"])
            
            dbQuery {
                val existingLike = PostLikes.selectAll().where { (PostLikes.userId eq userId) and (PostLikes.postId eq postId) }.singleOrNull()
                if (existingLike == null) {
                    PostLikes.insert { it[PostLikes.userId] = userId; it[PostLikes.postId] = postId }
                    Posts.update({ Posts.id eq postId }) { it[Posts.likeCount] = Posts.likeCount.plus(1) }
                } else {
                    PostLikes.deleteWhere { (PostLikes.userId eq userId) and (PostLikes.postId eq postId) }
                    Posts.update({ Posts.id eq postId }) { it[Posts.likeCount] = Posts.likeCount.minus(1) }
                }
            }
            call.respond(HttpStatusCode.OK)
        }

        // 북마크 토글 (Bookmark Toggle)
        post("/{id}/bookmark") {
            val userId = call.getUserIdFromHeader() ?: return@post call.respond(HttpStatusCode.Unauthorized, "Invalid User")
            val postId = UUID.fromString(call.parameters["id"])
            
            dbQuery {
                val existingBookmark = Bookmarks.selectAll().where { (Bookmarks.userId eq userId) and (Bookmarks.postId eq postId) }.singleOrNull()
                if (existingBookmark == null) {
                    Bookmarks.insert { it[Bookmarks.userId] = userId; it[Bookmarks.postId] = postId }
                } else {
                    Bookmarks.deleteWhere { (Bookmarks.userId eq userId) and (Bookmarks.postId eq postId) }
                }
            }
            call.respond(HttpStatusCode.OK)
        }

        // 내 북마크 조회
        get("/bookmarks") {
            val userId = call.getUserIdFromHeader() ?: return@get call.respond(HttpStatusCode.Unauthorized, "Invalid User")
            val bookmarkedPosts = dbQuery {
                (Bookmarks innerJoin Posts).selectAll().where { Bookmarks.userId eq userId }
                    .orderBy(Bookmarks.createdAt to SortOrder.DESC)
                    .map { row ->
                        mapOf(
                            "id" to row[Posts.id].toString(),
                            "title" to row[Posts.title],
                            "contentSummary" to row[Posts.contentSummary],
                            "likeCount" to row[Posts.likeCount],
                            "cloneCount" to row[Posts.cloneCount]
                        )
                    }
            }
            call.respond(bookmarkedPosts)
        }
    }
}
