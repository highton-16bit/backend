package com.plog.repository

import com.plog.entity.Post
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.*

interface PostRepository : JpaRepository<Post, UUID> {
    fun findAllByOrderByCreatedAtDesc(): List<Post>

    @Query("""
        SELECT DISTINCT p FROM Post p
        JOIN FETCH p.travel t
        LEFT JOIN FETCH p.photos
        WHERE LOWER(t.regionName) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(p.contentSummary) LIKE LOWER(CONCAT('%', :query, '%'))
        ORDER BY p.likeCount DESC
    """)
    fun searchByRegionOrContent(query: String): List<Post>

    @Query("""
        SELECT DISTINCT p FROM Post p
        JOIN FETCH p.travel t
        LEFT JOIN FETCH p.photos
        WHERE LOWER(t.regionName) LIKE LOWER(CONCAT('%', :regionName, '%'))
        ORDER BY p.likeCount DESC
    """)
    fun findByRegionOrderByLikeCountDesc(regionName: String): List<Post>
}
