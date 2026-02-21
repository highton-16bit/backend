package com.plog.repository

import com.plog.entity.TravelPlanItem
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface TravelPlanItemRepository : JpaRepository<TravelPlanItem, UUID> {
    fun findByTravelIdOrderByDateAscStartTimeAsc(travelId: UUID): List<TravelPlanItem>
}
