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
import org.jetbrains.exposed.sql.SqlExpressionBuilder.minus
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import java.util.*
import kotlinx.serialization.Serializable

@Serializable
data class PostCreateRequest(
    val travelId: String,
    val title: String,
    val photoIds: List<String>
)

@Serializable
data class PostPhotoResponse(
    val id: String,
    val url: String
)

@Serializable
data class PostResponse(
    val id: String,
    val title: String,
    val contentSummary: String?,
    val likeCount: Int,
    val cloneCount: Int,
    val createdAt: String,
    val username: String?,
    val photos: List<PostPhotoResponse>
)

@Serializable
data class PostCreateResponse(
    val id: String,
    val summary: String
)

@Serializable
data class PostListResponse(
    val posts: List<PostResponse>
)

// 게시글에 photos 정보를 포함하여 반환하는 헬퍼 함수
private suspend fun getPostWithPhotos(postId: UUID): PostResponse? {
    return dbQuery {
        val postRow = Posts.selectAll().where { Posts.id eq postId }.singleOrNull()
            ?: return@dbQuery null

        val photos = (PostPhotoMappings innerJoin TravelPhotos)
            .selectAll().where { PostPhotoMappings.postId eq postId }
            .map { photoRow ->
                PostPhotoResponse(
                    id = photoRow[TravelPhotos.id].toString(),
                    url = photoRow[TravelPhotos.imageUrl]
                )
            }

        // 유저 이름 조회
        val username = Users.selectAll().where { Users.id eq postRow[Posts.userId] }
            .map { it[Users.username] }
            .singleOrNull()

        PostResponse(
            id = postRow[Posts.id].toString(),
            title = postRow[Posts.title],
            contentSummary = postRow[Posts.contentSummary],
            likeCount = postRow[Posts.likeCount],
            cloneCount = postRow[Posts.cloneCount],
            createdAt = postRow[Posts.createdAt].toString(),
            username = username,
            photos = photos
        )
    }
}

fun Route.postRoutes(geminiService: GeminiService) {
    route("/posts") {

        // 피드 조회 (photos 포함)
        get {
            val posts: List<PostResponse> = dbQuery {
                val allPosts = Posts.selectAll()
                    .orderBy(Posts.createdAt to SortOrder.DESC)
                    .toList()

                allPosts.map { row ->
                    val postId = row[Posts.id]

                    // 해당 게시글의 사진들 조회
                    val photos = (PostPhotoMappings innerJoin TravelPhotos)
                        .selectAll().where { PostPhotoMappings.postId eq postId }
                        .map { photoRow ->
                            PostPhotoResponse(
                                id = photoRow[TravelPhotos.id].toString(),
                                url = photoRow[TravelPhotos.imageUrl]
                            )
                        }

                    // 유저 이름 조회
                    val username = Users.selectAll().where { Users.id eq row[Posts.userId] }
                        .map { it[Users.username] }
                        .singleOrNull()

                    PostResponse(
                        id = postId.toString(),
                        title = row[Posts.title],
                        contentSummary = row[Posts.contentSummary],
                        likeCount = row[Posts.likeCount],
                        cloneCount = row[Posts.cloneCount],
                        createdAt = row[Posts.createdAt].toString(),
                        username = username,
                        photos = photos
                    )
                }
            }
            call.respond(PostListResponse(posts = posts))
        }

        // 게시글 상세 조회
        get("/{id}") {
            val postId = UUID.fromString(call.parameters["id"])
            val post = getPostWithPhotos(postId)
            if (post == null) {
                call.respond(HttpStatusCode.NotFound, "Post not found")
            } else {
                call.respond(post)
            }
        }

        // 게시글 생성 (Gemini AI Flattening 연동)
        post {
            val userId = call.getUserIdFromHeader() ?: return@post call.respond(HttpStatusCode.Unauthorized, "Invalid User")
            val request = call.receive<PostCreateRequest>()
            val travelId = UUID.fromString(request.travelId)
            
            val plansRaw = dbQuery {
                TravelPlanItems.selectAll().where { TravelPlanItems.travelId eq travelId }
                    .orderBy(TravelPlanItems.date to SortOrder.ASC)
                    .orderBy(TravelPlanItems.startTime to SortOrder.ASC)
                    .map { row ->
                        "${row[TravelPlanItems.date]} ${row[TravelPlanItems.startTime] ?: ""} : ${row[TravelPlanItems.memo] ?: "일정"}"
                    }
            }
            
            val prompt = """
                다음은 사용자의 여행 일정 목록입니다:
                ${plansRaw.joinToString("\n")}
                
                이 일정들을 바탕으로, 인스타그램에 올릴 만한 감성적이고 따뜻한 여행 에세이(본문)를 작성해주세요. 
                너무 길지 않게 3~5문장 정도로 작성해주고, 해시태그도 2~3개 포함해주세요.
                이모지도 적절히 섞어주세요.
            """.trimIndent()

            val aiSummary = try {
                geminiService.generateText(prompt)
            } catch (e: Exception) {
                plansRaw.joinToString("\n")
            }

            val newPostId = dbQuery {
                val postId = Posts.insert {
                    it[Posts.travelId] = travelId
                    it[Posts.userId] = userId
                    it[Posts.title] = request.title
                    it[Posts.contentSummary] = aiSummary
                } get Posts.id
                
                request.photoIds.forEach { photoId ->
                    PostPhotoMappings.insert {
                        it[PostPhotoMappings.postId] = postId
                        it[PostPhotoMappings.photoId] = UUID.fromString(photoId)
                    }
                }
                postId
            }
            
            call.respond(HttpStatusCode.Created, PostCreateResponse(id = newPostId.toString(), summary = aiSummary))
        }

        // 좋아요 토글
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

        // 북마크 토글
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

        // 북마크 목록 (photos 포함)
        get("/bookmarks") {
            val userId = call.getUserIdFromHeader() ?: return@get call.respond(HttpStatusCode.Unauthorized, "Invalid User")
            val bookmarkedPosts: List<PostResponse> = dbQuery {
                (Bookmarks innerJoin Posts).selectAll().where { Bookmarks.userId eq userId }
                    .orderBy(Bookmarks.createdAt to SortOrder.DESC)
                    .map { row ->
                        val postId = row[Posts.id]

                        // 해당 게시글의 사진들 조회
                        val photos = (PostPhotoMappings innerJoin TravelPhotos)
                            .selectAll().where { PostPhotoMappings.postId eq postId }
                            .map { photoRow ->
                                PostPhotoResponse(
                                    id = photoRow[TravelPhotos.id].toString(),
                                    url = photoRow[TravelPhotos.imageUrl]
                                )
                            }

                        // 유저 이름 조회
                        val username = Users.selectAll().where { Users.id eq row[Posts.userId] }
                            .map { it[Users.username] }
                            .singleOrNull()

                        PostResponse(
                            id = postId.toString(),
                            title = row[Posts.title],
                            contentSummary = row[Posts.contentSummary],
                            likeCount = row[Posts.likeCount],
                            cloneCount = row[Posts.cloneCount],
                            createdAt = row[Posts.createdAt].toString(),
                            username = username,
                            photos = photos
                        )
                    }
            }
            call.respond(PostListResponse(posts = bookmarkedPosts))
        }
    }
}
