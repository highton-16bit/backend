package com.plog.entity

import jakarta.persistence.*
import java.io.Serializable
import java.time.LocalDateTime
import java.util.*

@Embeddable
data class BookmarkId(
    val userId: UUID = UUID.randomUUID(),
    val postId: UUID = UUID.randomUUID()
) : Serializable

@Entity
@Table(name = "bookmarks")
class Bookmark(
    @EmbeddedId
    val id: BookmarkId,

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    val user: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("postId")
    @JoinColumn(name = "post_id")
    val post: Post,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
