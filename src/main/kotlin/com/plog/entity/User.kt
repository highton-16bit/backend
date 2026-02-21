package com.plog.entity

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.*

@Entity
@Table(name = "users")
class User(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(unique = true, nullable = false)
    val username: String,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
