package com.plog.controller

import com.plog.dto.*
import com.plog.service.SearchService
import com.plog.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@Tag(name = "Search", description = "검색 API")
@RestController
@RequestMapping("/search")
class SearchController(
    private val searchService: SearchService,
    private val userService: UserService
) {
    @Operation(
        summary = "지역 기반 검색",
        description = "지역명 또는 키워드로 게시글을 검색합니다. 인기순 정렬 및 지도 핀 정보를 반환합니다."
    )
    @GetMapping
    fun search(
        @Parameter(description = "검색어 (예: 전주, 부산 광안리)")
        @RequestParam q: String
    ): ResponseEntity<Any> {
        if (q.isBlank()) {
            return ResponseEntity.badRequest().body(MessageResponse("Missing query"))
        }

        return ResponseEntity.ok(searchService.searchByRegion(q))
    }

    @Operation(
        summary = "AI 검색",
        description = "자연어 질문에 대해 AI가 답변을 생성하고 관련 게시글을 반환합니다."
    )
    @GetMapping("/ai")
    fun searchWithAI(
        @Parameter(description = "질문 (예: 제주도 2박3일 추천해줘)")
        @RequestParam q: String
    ): ResponseEntity<Any> {
        if (q.isBlank()) {
            return ResponseEntity.badRequest().body(MessageResponse("Missing query"))
        }

        return ResponseEntity.ok(searchService.searchWithAI(q))
    }

    @Operation(
        summary = "지역별 인기 피드",
        description = "특정 지역의 인기 게시글을 조회합니다."
    )
    @GetMapping("/region/{regionName}")
    fun getRegionFeed(
        @Parameter(description = "지역명")
        @PathVariable regionName: String
    ): ResponseEntity<RegionSearchResponse> {
        return ResponseEntity.ok(searchService.findByRegion(regionName))
    }

    @Operation(
        summary = "스마트 클로닝",
        description = "게시글의 여행 일정을 AI가 파싱하여 새로운 여행으로 복제합니다."
    )
    @PostMapping("/clone/{postId}")
    fun clonePost(
        @RequestHeader("Authorization") username: String,
        @PathVariable postId: UUID
    ): ResponseEntity<Any> {
        val user = userService.getOrCreate(username)

        return try {
            val response = searchService.clonePost(user, postId)
            ResponseEntity.status(HttpStatus.CREATED).body(response)
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(MessageResponse(e.message ?: "Invalid request"))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(MessageResponse("Failed to clone: ${e.message}"))
        }
    }
}
