package com.plog.repository

import com.plog.entity.Travel
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.LocalDate
import java.util.*

interface TravelRepository : JpaRepository<Travel, UUID> {
    fun findByUserIdOrderByCreatedAtDesc(userId: UUID): List<Travel>

    @Query("""
        SELECT t FROM Travel t
        WHERE t.user.id = :userId
        AND t.startDate <= :today
        AND t.endDate >= :today
        ORDER BY t.createdAt DESC
        LIMIT 1
    """)
    fun findActiveTravel(userId: UUID, today: LocalDate): Travel?
}
