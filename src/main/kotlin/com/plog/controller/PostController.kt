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
    @Operation(summary = "피드 조회", description = "전체 게시글을 최신순으로 조회합니다")
    @GetMapping
    fun getFeed(): ResponseEntity<PostListResponse> {
        return ResponseEntity.ok(PostListResponse(posts = postService.findAll()))
    }

    @Operation(summary = "게시글 상세 조회")
    @GetMapping("/{id}")
    fun getPost(@PathVariable id: UUID): ResponseEntity<Any> {
        val post = postService.findById(id)
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
