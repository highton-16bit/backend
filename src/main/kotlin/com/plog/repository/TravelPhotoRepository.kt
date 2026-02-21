package com.plog.repository

import com.plog.entity.TravelPhoto
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface TravelPhotoRepository : JpaRepository<TravelPhoto, UUID> {
    // createdAt 순서로 정렬 (업로드 순서 유지)
    fun findByTravelIdOrderByCreatedAtAsc(travelId: UUID): List<TravelPhoto>
}
