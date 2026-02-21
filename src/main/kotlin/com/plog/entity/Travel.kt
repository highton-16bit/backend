package com.plog.entity

import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.*

@Entity
@Table(name = "travels")
class Travel(
    @Id
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(nullable = false)
    var title: String,

    @Column(name = "start_date", nullable = false)
    var startDate: LocalDate,

    @Column(name = "end_date", nullable = false)
    var endDate: LocalDate,

    @Column(name = "region_name")
    var regionName: String? = null,

    @Column(name = "is_public", nullable = false)
    var isPublic: Boolean = false,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @OneToMany(mappedBy = "travel", cascade = [CascadeType.ALL], orphanRemoval = true)
    val planItems: MutableList<TravelPlanItem> = mutableListOf(),

    @OneToMany(mappedBy = "travel", cascade = [CascadeType.ALL])
    val photos: MutableList<TravelPhoto> = mutableListOf()
)
