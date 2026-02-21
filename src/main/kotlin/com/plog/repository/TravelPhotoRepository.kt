package com.plog.repository

import com.plog.entity.TravelPhoto
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface TravelPhotoRepository : JpaRepository<TravelPhoto, UUID> {
    fun findByTravelId(travelId: UUID): List<TravelPhoto>
}
