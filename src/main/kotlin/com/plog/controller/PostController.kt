package com.plog.controller

import com.plog.dto.*
import com.plog.service.PostService
import com.plog.service.TravelService
import com.plog.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@Tag(name = "Posts", description = "게시글 API")
@RestController
@RequestMapping("/posts")
class PostController(
    private val postService: PostService,
    private val travelService: TravelService,
    private val userService: UserService
) {
    @Operation(
        summary = "피드 조회",
        description = """
        전체 게시글을 최신순으로 조회합니다.
        Authorization 헤더가 있으면 isLiked, isBookmarked 필드가 현재 사용자 기준으로 설정됩니다.

        **사용 화면:** HomePage, DiscoveryPage
        **관련 API:** POST /posts/{id}/like, POST /posts/{id}/bookmark
        """
    )
    @GetMapping
    fun getFeed(
        @RequestHeader("Authorization", required = false) username: String?
    ): ResponseEntity<PostListResponse> {
        val userId = username?.let { userService.findByUsername(it)?.id }
        return ResponseEntity.ok(PostListResponse(posts = postService.findAll(userId)))
    }

    @Operation(
        summary = "게시글 상세 조회",
        description = """
        게시글 상세 정보를 조회합니다.
        Authorization 헤더가 있으면 isLiked, isBookmarked 필드가 현재 사용자 기준으로 설정됩니다.

        **사용 화면:** PostDetail 모달
        **관련 API:** PATCH /posts/{id}, DELETE /posts/{id}
        """
    )
    @GetMapping("/{id}")
    fun getPost(
        @PathVariable id: UUID,
        @RequestHeader("Authorization", required = false) username: String?
    ): ResponseEntity<Any> {
        val userId = username?.let { userService.findByUsername(it)?.id }
        val post = postService.findById(id, userId)
            ?: return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(MessageResponse("Post not found"))

        return ResponseEntity.ok(post)
    }

    @Operation(summary = "게시글 생성", description = "AI가 자동으로 여행 일정을 요약하여 본문을 생성합니다")
    @PostMapping
    fun createPost(
        @RequestHeader("Authorization") username: String,
        @RequestBody request: PostCreateRequest
    ): ResponseEntity<Any> {
        val user = userService.findByUsername(username)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(MessageResponse("Unauthorized"))

        val travelId = try {
            UUID.fromString(request.travelId)
        } catch (e: Exception) {
            return ResponseEntity.badRequest().body(MessageResponse("Invalid Travel ID"))
        }

        val travel = travelService.findById(travelId)
            ?: return ResponseEntity.badRequest().body(MessageResponse("Invalid Travel ID"))

        val photoIds = request.photoIds.mapNotNull {
            try { UUID.fromString(it) } catch (e: Exception) { null }
        }

        val response = postService.create(user, travel, request, photoIds)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @Operation(
        summary = "게시글 수정",
        description = """
        게시글의 제목, 본문, 사진을 수정합니다. 본인 게시글만 수정 가능합니다.

        **사용 화면:** NewPage > ShareMemory > Step3 (Edit Post)
        **관련 API:** GET /posts/{id}, GET /travels/{id}/photos
        """
    )
    @PatchMapping("/{id}")
    fun updatePost(
        @RequestHeader("Authorization") username: String,
        @PathVariable id: UUID,
        @RequestBody request: PostUpdateRequest
    ): ResponseEntity<Any> {
        val user = userService.findByUsername(username)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(MessageResponse("Unauthorized"))

        return try {
            postService.update(id, user.id, request)
            ResponseEntity.ok(MessageResponse("Updated"))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(MessageResponse(e.message ?: "Invalid request"))
        }
    }

    @Operation(
        summary = "게시글 삭제",
        description = """
        게시글을 삭제합니다. 본인 게시글만 삭제 가능합니다.

        **사용 화면:** ProfilePage (내 게시글 관리)
        **관련 API:** GET /posts/{id}
        """
    )
    @DeleteMapping("/{id}")
    fun deletePost(
        @RequestHeader("Authorization") username: String,
        @PathVariable id: UUID
    ): ResponseEntity<Any> {
        val user = userService.findByUsername(username)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(MessageResponse("Unauthorized"))

        return try {
            postService.delete(id, user.id)
            ResponseEntity.ok(MessageResponse("Deleted"))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(MessageResponse(e.message ?: "Invalid request"))
        }
    }

    @Operation(summary = "좋아요 토글")
    @PostMapping("/{id}/like")
    fun toggleLike(
        @RequestHeader("Authorization") username: String,
        @PathVariable id: UUID
    ): ResponseEntity<Any> {
        val user = userService.findByUsername(username)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(MessageResponse("Unauthorized"))

        val post = postService.getPostEntity(id)
            ?: return ResponseEntity.badRequest().body(MessageResponse("Invalid ID"))

        postService.toggleLike(user.id, id, user, post)
        return ResponseEntity.ok(MessageResponse("Toggled"))
    }

    @Operation(summary = "북마크 토글")
    @PostMapping("/{id}/bookmark")
    fun toggleBookmark(
        @RequestHeader("Authorization") username: String,
        @PathVariable id: UUID
    ): ResponseEntity<Any> {
        val user = userService.findByUsername(username)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(MessageResponse("Unauthorized"))

        val post = postService.getPostEntity(id)
            ?: return ResponseEntity.badRequest().body(MessageResponse("Invalid ID"))

        postService.toggleBookmark(user.id, id, user, post)
        return ResponseEntity.ok(MessageResponse("Toggled"))
    }

    @Operation(summary = "북마크 목록", description = "사용자가 북마크한 게시글 목록을 조회합니다")
    @GetMapping("/bookmarks")
    fun getBookmarks(
        @RequestHeader("Authorization") username: String
    ): ResponseEntity<Any> {
        val user = userService.findByUsername(username)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(MessageResponse("Unauthorized"))

        return ResponseEntity.ok(PostListResponse(posts = postService.findBookmarkedPosts(user.id)))
    }
}
