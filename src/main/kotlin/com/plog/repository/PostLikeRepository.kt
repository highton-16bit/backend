package com.plog.repository

import com.plog.entity.PostLike
import com.plog.entity.PostLikeId
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface PostLikeRepository : JpaRepository<PostLike, PostLikeId> {
    fun existsByUserIdAndPostId(userId: UUID, postId: UUID): Boolean
    fun deleteByUserIdAndPostId(userId: UUID, postId: UUID)
}
