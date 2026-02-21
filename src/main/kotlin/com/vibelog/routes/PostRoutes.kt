package com.vibelog.routes

import com.vibelog.models.*
import com.vibelog.plugins.dbQuery
import com.vibelog.services.GeminiService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.minus
import org.jetbrains.exposed.sql.SqlExpressionBuilder.plus
import java.util.*

fun Route.postRoutes(geminiService: GeminiService) {
    route("/posts") {

        // 피드 조회 (전체 게시글)
        get {
            val posts = dbQuery {
                Posts.selectAll()
                    .orderBy(Posts.createdAt to SortOrder.DESC)
                    .map { row -> row.toPostResponse() }
            }

            call.respond(PostListResponse(posts = posts))
        }

        // 게시글 상세
        get("/{id}") {
            val postId = call.parameters["id"]?.toUuidOrNull()
                ?: return@get call.respond(HttpStatusCode.BadRequest, MessageResponse("Invalid ID"))

            val post = dbQuery {
                Posts.selectAll()
                    .where { Posts.id eq postId }
                    .map { it.toPostResponse() }
                    .singleOrNull()
            }

            if (post != null) {
                call.respond(post)
            } else {
                call.respond(HttpStatusCode.NotFound, MessageResponse("Post not found"))
            }
        }

        // 게시글 생성 (AI 요약 자동 생성)
        post {
            val userId = call.getUserId()
                ?: return@post call.respond(HttpStatusCode.Unauthorized, MessageResponse("Unauthorized"))

            val request = call.receive<PostCreateRequest>()
            val travelId = request.travelId.toUuidOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, MessageResponse("Invalid Travel ID"))

            // 일정 조회하여 AI 프롬프트 생성
            val plans = dbQuery {
                TravelPlanItems.selectAll()
                    .where { TravelPlanItems.travelId eq travelId }
                    .orderBy(TravelPlanItems.date to SortOrder.ASC)
                    .orderBy(TravelPlanItems.startTime to SortOrder.ASC)
                    .map { row ->
                        "${row[TravelPlanItems.date]} ${row[TravelPlanItems.startTime] ?: ""} : ${row[TravelPlanItems.memo] ?: "일정"}"
                    }
            }

            val prompt = """
                다음은 사용자의 여행 일정 목록입니다:
                ${plans.joinToString("\n")}

                이 일정들을 바탕으로, 인스타그램에 올릴 만한 감성적이고 따뜻한 여행 에세이(본문)를 작성해주세요.
                너무 길지 않게 3~5문장 정도로 작성해주고, 해시태그도 2~3개 포함해주세요.
                이모지도 적절히 섞어주세요.
            """.trimIndent()

            val aiSummary = try {
                geminiService.generateText(prompt)
            } catch (e: Exception) {
                plans.joinToString("\n")
            }

            val newPostId = dbQuery {
                val postId = Posts.insert {
                    it[Posts.travelId] = travelId
                    it[Posts.userId] = userId
                    it[title] = request.title
                    it[contentSummary] = aiSummary
                } get Posts.id

                // 사진 매핑
                request.photoIds.forEach { photoIdStr ->
                    val photoId = photoIdStr.toUuidOrNull() ?: return@forEach
                    PostPhotoMappings.insert {
                        it[PostPhotoMappings.postId] = postId
                        it[PostPhotoMappings.photoId] = photoId
                    }
                }

                postId
            }

            call.respond(HttpStatusCode.Created, PostCreateResponse(id = newPostId.toString(), summary = aiSummary))
        }

        // 좋아요 토글
        post("/{id}/like") {
            val userId = call.getUserId()
                ?: return@post call.respond(HttpStatusCode.Unauthorized, MessageResponse("Unauthorized"))

            val postId = call.parameters["id"]?.toUuidOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, MessageResponse("Invalid ID"))

            dbQuery {
                val exists = PostLikes.selectAll()
                    .where { (PostLikes.userId eq userId) and (PostLikes.postId eq postId) }
                    .singleOrNull()

                if (exists == null) {
                    PostLikes.insert {
                        it[PostLikes.userId] = userId
                        it[PostLikes.postId] = postId
                    }
                    Posts.update({ Posts.id eq postId }) {
                        it[likeCount] = likeCount plus 1
                    }
                } else {
                    PostLikes.deleteWhere { (PostLikes.userId eq userId) and (PostLikes.postId eq postId) }
                    Posts.update({ Posts.id eq postId }) {
                        it[likeCount] = likeCount minus 1
                    }
                }
            }

            call.respond(HttpStatusCode.OK, MessageResponse("Toggled"))
        }

        // 북마크 토글
        post("/{id}/bookmark") {
            val userId = call.getUserId()
                ?: return@post call.respond(HttpStatusCode.Unauthorized, MessageResponse("Unauthorized"))

            val postId = call.parameters["id"]?.toUuidOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, MessageResponse("Invalid ID"))

            dbQuery {
                val exists = Bookmarks.selectAll()
                    .where { (Bookmarks.userId eq userId) and (Bookmarks.postId eq postId) }
                    .singleOrNull()

                if (exists == null) {
                    Bookmarks.insert {
                        it[Bookmarks.userId] = userId
                        it[Bookmarks.postId] = postId
                    }
                } else {
                    Bookmarks.deleteWhere { (Bookmarks.userId eq userId) and (Bookmarks.postId eq postId) }
                }
            }

            call.respond(HttpStatusCode.OK, MessageResponse("Toggled"))
        }

        // 북마크 목록
        get("/bookmarks") {
            val userId = call.getUserId()
                ?: return@get call.respond(HttpStatusCode.Unauthorized, MessageResponse("Unauthorized"))

            val posts = dbQuery {
                (Bookmarks innerJoin Posts)
                    .selectAll()
                    .where { Bookmarks.userId eq userId }
                    .orderBy(Bookmarks.createdAt to SortOrder.DESC)
                    .map { row ->
                        row.toPostResponse()
                    }
            }

            call.respond(PostListResponse(posts = posts))
        }
    }
}

// Extension function to convert ResultRow to PostResponse
private suspend fun ResultRow.toPostResponse(): PostResponse {
    val postId = this[Posts.id]
    val travelId = this[Posts.travelId]

    // 사진 조회 (좌표 포함)
    val photos = dbQuery {
        (PostPhotoMappings innerJoin TravelPhotos)
            .selectAll()
            .where { PostPhotoMappings.postId eq postId }
            .map { photoRow ->
                PostPhotoResponse(
                    id = photoRow[TravelPhotos.id].toString(),
                    url = photoRow[TravelPhotos.imageUrl],
                    latitude = photoRow[TravelPhotos.latitude],
                    longitude = photoRow[TravelPhotos.longitude]
                )
            }
    }

    // 여행 정보 조회 (지역명)
    val travel = dbQuery {
        Travels.selectAll()
            .where { Travels.id eq travelId }
            .singleOrNull()
    }

    val username = dbQuery {
        Users.selectAll()
            .where { Users.id eq this@toPostResponse[Posts.userId] }
            .map { it[Users.username] }
            .singleOrNull()
    }

    // 대표 좌표 계산 (사진들의 평균 좌표)
    val photosWithCoords = photos.filter { it.latitude != null && it.longitude != null }
    val avgLat = if (photosWithCoords.isNotEmpty()) {
        photosWithCoords.mapNotNull { it.latitude }.average()
    } else null
    val avgLng = if (photosWithCoords.isNotEmpty()) {
        photosWithCoords.mapNotNull { it.longitude }.average()
    } else null

    return PostResponse(
        id = postId.toString(),
        title = this[Posts.title],
        contentSummary = this[Posts.contentSummary],
        likeCount = this[Posts.likeCount],
        cloneCount = this[Posts.cloneCount],
        createdAt = this[Posts.createdAt].toString(),
        username = username,
        photos = photos,
        regionName = travel?.get(Travels.regionName),
        latitude = avgLat,
        longitude = avgLng
    )
}

private fun String.toUuidOrNull(): UUID? = try {
    UUID.fromString(this)
} catch (e: Exception) {
    null
}
