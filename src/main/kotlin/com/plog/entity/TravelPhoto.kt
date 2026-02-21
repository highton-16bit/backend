package com.plog.entity

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.*

@Entity
@Table(name = "travel_photos")
class TravelPhoto(
    @Id
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "travel_id", nullable = false)
    val travel: Travel,

    @Column(name = "image_url", nullable = false)
    val imageUrl: String,

    @Column(name = "is_snapshot", nullable = false)
    val isSnapshot: Boolean = false,

    @Column
    val latitude: Double? = null,

    @Column
    val longitude: Double? = null,

    @Column(name = "captured_at")
    val capturedAt: LocalDateTime? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
