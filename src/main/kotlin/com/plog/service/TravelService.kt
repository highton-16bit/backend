package com.plog.service

import com.plog.dto.*
import com.plog.entity.Travel
import com.plog.entity.TravelPlanItem
import com.plog.entity.User
import com.plog.repository.TravelPlanItemRepository
import com.plog.repository.TravelRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.*

@Service
@Transactional(readOnly = true)
class TravelService(
    private val travelRepository: TravelRepository,
    private val planItemRepository: TravelPlanItemRepository
) {
    fun findByUserId(userId: UUID): List<TravelResponse> {
        return travelRepository.findByUserIdOrderByCreatedAtDesc(userId)
            .map { it.toResponse() }
    }

    fun findActiveTravel(userId: UUID): TravelResponse? {
        return travelRepository.findActiveTravel(userId, LocalDate.now())?.toResponse()
    }

    fun findById(id: UUID): Travel? {
        return travelRepository.findById(id).orElse(null)
    }

    fun findResponseById(id: UUID): TravelResponse? {
        return findById(id)?.toResponse()
    }

    @Transactional
    fun create(user: User, request: TravelCreateRequest): String {
        val travel = Travel(
            user = user,
            title = request.title,
            startDate = request.startDate,
            endDate = request.endDate,
            regionName = request.regionName,
            isPublic = request.isPublic
        )
        return travelRepository.save(travel).id.toString()
    }

    @Transactional
    fun delete(id: UUID) {
        travelRepository.deleteById(id)
    }

    // Plan Items
    fun findPlansByTravelId(travelId: UUID): List<PlanResponse> {
        return planItemRepository.findByTravelIdOrderByDateAscStartTimeAsc(travelId)
            .map { it.toResponse() }
    }

    @Transactional
    fun createPlan(travel: Travel, request: PlanCreateRequest): String {
        if (request.startTime != null && request.endTime != null) {
            require(request.startTime <= request.endTime) {
                "Start time must be earlier than end time"
            }
        }

        val planItem = TravelPlanItem(
            travel = travel,
            date = request.date,
            startTime = request.startTime,
            endTime = request.endTime,
            memo = request.memo,
            orderIndex = request.orderIndex
        )
        return planItemRepository.save(planItem).id.toString()
    }

    @Transactional
    fun updatePlan(planId: UUID, request: PlanCreateRequest) {
        if (request.startTime != null && request.endTime != null) {
            require(request.startTime <= request.endTime) {
                "Start time must be earlier than end time"
            }
        }

        val planItem = planItemRepository.findById(planId)
            .orElseThrow { IllegalArgumentException("Plan not found") }

        planItem.date = request.date
        planItem.startTime = request.startTime
        planItem.endTime = request.endTime
        planItem.memo = request.memo
        planItem.orderIndex = request.orderIndex
    }

    @Transactional
    fun deletePlan(planId: UUID) {
        planItemRepository.deleteById(planId)
    }

    private fun Travel.toResponse() = TravelResponse(
        id = id.toString(),
        title = title,
        startDate = startDate.toString(),
        endDate = endDate.toString(),
        regionName = regionName,
        isPublic = isPublic
    )

    private fun TravelPlanItem.toResponse() = PlanResponse(
        id = id.toString(),
        date = date.toString(),
        startTime = startTime,
        endTime = endTime,
        memo = memo
    )
}
