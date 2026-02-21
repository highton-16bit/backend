package com.plog.repository

import com.plog.entity.Bookmark
import com.plog.entity.BookmarkId
import com.plog.entity.Post
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.*

interface BookmarkRepository : JpaRepository<Bookmark, BookmarkId> {
    fun existsByUserIdAndPostId(userId: UUID, postId: UUID): Boolean
    fun deleteByUserIdAndPostId(userId: UUID, postId: UUID)

    @Query("SELECT b.post FROM Bookmark b WHERE b.user.id = :userId ORDER BY b.createdAt DESC")
    fun findBookmarkedPosts(userId: UUID): List<Post>
}
