package com.plog.entity

import jakarta.persistence.*
import java.time.LocalDate
import java.util.*

@Entity
@Table(name = "travel_plan_items")
class TravelPlanItem(
    @Id
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "travel_id", nullable = false)
    val travel: Travel,

    @Column(nullable = false)
    var date: LocalDate,

    @Column(name = "start_time")
    var startTime: String? = null,

    @Column(name = "end_time")
    var endTime: String? = null,

    @Column
    var memo: String? = null,

    @Column(name = "order_index", nullable = false)
    var orderIndex: Int = 0
)
