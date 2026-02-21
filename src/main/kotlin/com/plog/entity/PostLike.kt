package com.plog.entity

import jakarta.persistence.*
import java.io.Serializable
import java.util.*

@Embeddable
data class PostLikeId(
    val userId: UUID = UUID.randomUUID(),
    val postId: UUID = UUID.randomUUID()
) : Serializable

@Entity
@Table(name = "post_likes")
class PostLike(
    @EmbeddedId
    val id: PostLikeId,

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    val user: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("postId")
    @JoinColumn(name = "post_id")
    val post: Post
)
