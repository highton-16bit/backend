package com.plog.entity

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.*

@Entity
@Table(name = "posts")
class Post(
    @Id
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "travel_id", nullable = false)
    val travel: Travel,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(nullable = false)
    var title: String,

    @Column(name = "content_summary")
    var contentSummary: String? = null,

    @Column(name = "like_count", nullable = false)
    var likeCount: Int = 0,

    @Column(name = "clone_count", nullable = false)
    var cloneCount: Int = 0,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @ManyToMany
    @JoinTable(
        name = "post_photo_mappings",
        joinColumns = [JoinColumn(name = "post_id")],
        inverseJoinColumns = [JoinColumn(name = "photo_id")]
    )
    val photos: MutableSet<TravelPhoto> = mutableSetOf(),

    @OneToMany(mappedBy = "post", cascade = [CascadeType.ALL], orphanRemoval = true)
    val likes: MutableSet<PostLike> = mutableSetOf(),

    @OneToMany(mappedBy = "post", cascade = [CascadeType.ALL], orphanRemoval = true)
    val bookmarks: MutableSet<Bookmark> = mutableSetOf()
)
