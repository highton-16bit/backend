package com.plog.controller

import com.plog.dto.*
import com.plog.service.TravelService
import com.plog.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@Tag(name = "Travels", description = "여행 관리 API")
@RestController
@RequestMapping("/travels")
class TravelController(
    private val travelService: TravelService,
    private val userService: UserService
) {
    @Operation(summary = "내 여행 목록", description = "로그인한 사용자의 여행 목록을 조회합니다")
    @GetMapping
    fun getMyTravels(
        @Parameter(description = "사용자명 (Authorization 헤더)")
        @RequestHeader("Authorization") username: String
    ): ResponseEntity<Any> {
        val user = userService.findByUsername(username)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(MessageResponse("Unauthorized"))

        return ResponseEntity.ok(travelService.findByUserId(user.id))
    }

    @Operation(summary = "현재 진행 중인 여행", description = "오늘 날짜 기준 진행 중인 여행을 조회합니다")
    @GetMapping("/active")
    fun getActiveTravel(
        @RequestHeader("Authorization") username: String
    ): ResponseEntity<Any> {
        val user = userService.findByUsername(username)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(MessageResponse("Unauthorized"))

        val active = travelService.findActiveTravel(user.id)
        return if (active != null) {
            ResponseEntity.ok(active)
        } else {
            ResponseEntity.noContent().build()
        }
    }

    @Operation(summary = "여행 상세 조회")
    @GetMapping("/{id}")
    fun getTravel(@PathVariable id: UUID): ResponseEntity<Any> {
        val travel = travelService.findResponseById(id)
            ?: return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(MessageResponse("Travel not found"))

        return ResponseEntity.ok(travel)
    }

    @Operation(summary = "여행 생성")
    @PostMapping
    fun createTravel(
        @RequestHeader("Authorization") username: String,
        @RequestBody request: TravelCreateRequest
    ): ResponseEntity<Any> {
        val user = userService.findByUsername(username)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(MessageResponse("Unauthorized"))

        val id = travelService.create(user, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(IdResponse(id))
    }

    @Operation(
        summary = "여행 수정",
        description = """
        여행 정보를 부분 수정합니다. 본인의 여행만 수정 가능합니다.

        **사용 화면:** TravelsPage > Travel Detail (수정 모드)
        **관련 API:** GET /travels/{id}, DELETE /travels/{id}
        """
    )
    @PatchMapping("/{id}")
    fun updateTravel(
        @RequestHeader("Authorization") username: String,
        @PathVariable id: UUID,
        @RequestBody request: TravelUpdateRequest
    ): ResponseEntity<Any> {
        val user = userService.findByUsername(username)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(MessageResponse("Unauthorized"))

        return try {
            travelService.update(id, user.id, request)
            ResponseEntity.ok(MessageResponse("Updated"))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(MessageResponse(e.message ?: "Invalid request"))
        }
    }

    @Operation(summary = "여행 삭제")
    @DeleteMapping("/{id}")
    fun deleteTravel(@PathVariable id: UUID): ResponseEntity<MessageResponse> {
        travelService.delete(id)
        return ResponseEntity.ok(MessageResponse("Deleted"))
    }

    // Plan Items

    @Operation(summary = "일정 목록 조회")
    @GetMapping("/{id}/plans")
    fun getPlans(@PathVariable id: UUID): ResponseEntity<List<PlanResponse>> {
        return ResponseEntity.ok(travelService.findPlansByTravelId(id))
    }

    @Operation(summary = "일정 추가")
    @PostMapping("/{id}/plans")
    fun createPlan(
        @PathVariable id: UUID,
        @RequestBody request: PlanCreateRequest
    ): ResponseEntity<Any> {
        val travel = travelService.findById(id)
            ?: return ResponseEntity.badRequest().body(MessageResponse("Invalid ID"))

        return try {
            val planId = travelService.createPlan(travel, request)
            ResponseEntity.status(HttpStatus.CREATED).body(IdResponse(planId))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(MessageResponse(e.message ?: "Invalid request"))
        }
    }

    @Operation(summary = "일정 수정")
    @PatchMapping("/{id}/plans/{planId}")
    fun updatePlan(
        @PathVariable id: UUID,
        @PathVariable planId: UUID,
        @RequestBody request: PlanCreateRequest
    ): ResponseEntity<Any> {
        return try {
            travelService.updatePlan(planId, request)
            ResponseEntity.ok(MessageResponse("Updated"))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(MessageResponse(e.message ?: "Invalid request"))
        }
    }

    @Operation(summary = "일정 삭제")
    @DeleteMapping("/{id}/plans/{planId}")
    fun deletePlan(
        @PathVariable id: UUID,
        @PathVariable planId: UUID
    ): ResponseEntity<MessageResponse> {
        travelService.deletePlan(planId)
        return ResponseEntity.ok(MessageResponse("Deleted"))
    }
}
