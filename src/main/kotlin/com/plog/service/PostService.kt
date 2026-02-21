package com.plog.service

import com.plog.dto.*
import com.plog.entity.*
import com.plog.repository.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
@Transactional(readOnly = true)
class PostService(
    private val postRepository: PostRepository,
    private val postLikeRepository: PostLikeRepository,
    private val bookmarkRepository: BookmarkRepository,
    private val travelPhotoRepository: TravelPhotoRepository,
    private val planItemRepository: TravelPlanItemRepository,
    private val geminiService: GeminiService
) {
    fun findAll(userId: UUID? = null): List<PostResponse> {
        return postRepository.findAllByOrderByCreatedAtDesc()
            .map { it.toResponse(userId) }
    }

    fun findById(id: UUID, userId: UUID? = null): PostResponse? {
        return postRepository.findById(id).orElse(null)?.toResponse(userId)
    }

    @Transactional
    fun create(user: User, travel: Travel, request: PostCreateRequest, photoIds: List<UUID>): PostCreateResponse {
        val post = Post(
            travel = travel,
            user = user,
            title = request.title,
            contentSummary = request.content
        )

        // 사진 매핑
        photoIds.forEach { photoId ->
            travelPhotoRepository.findById(photoId).ifPresent { photo ->
                post.photos.add(photo)
            }
        }

        val saved = postRepository.save(post)
        return PostCreateResponse(id = saved.id.toString(), summary = request.content ?: "")
    }

    @Transactional
    fun toggleLike(userId: UUID, postId: UUID, user: User, post: Post) {
        val exists = postLikeRepository.existsByUserIdAndPostId(userId, postId)

        if (exists) {
            postLikeRepository.deleteByUserIdAndPostId(userId, postId)
            post.likeCount = maxOf(0, post.likeCount - 1)
        } else {
            val like = PostLike(
                id = PostLikeId(userId, postId),
                user = user,
                post = post
            )
            postLikeRepository.save(like)
            post.likeCount += 1
        }
    }

    @Transactional
    fun toggleBookmark(userId: UUID, postId: UUID, user: User, post: Post) {
        val exists = bookmarkRepository.existsByUserIdAndPostId(userId, postId)

        if (exists) {
            bookmarkRepository.deleteByUserIdAndPostId(userId, postId)
        } else {
            val bookmark = Bookmark(
                id = BookmarkId(userId, postId),
                user = user,
                post = post
            )
            bookmarkRepository.save(bookmark)
        }
    }

    fun getPostEntity(id: UUID): Post? {
        return postRepository.findById(id).orElse(null)
    }

    @Transactional
    fun incrementCloneCount(postId: UUID) {
        postRepository.findById(postId).ifPresent { post ->
            post.cloneCount += 1
        }
    }

    @Transactional
    fun update(id: UUID, userId: UUID, request: PostUpdateRequest) {
        val post = postRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Post not found") }

        require(post.user.id == userId) { "Unauthorized: You can only edit your own post" }

        request.title?.let { post.title = it }
        request.contentSummary?.let { post.contentSummary = it }

        request.photoIds?.let { photoIds ->
            post.photos.clear()
            photoIds.forEach { photoIdStr ->
                try {
                    val photoId = UUID.fromString(photoIdStr)
                    travelPhotoRepository.findById(photoId).ifPresent { photo ->
                        post.photos.add(photo)
                    }
                } catch (e: Exception) {
                    // Invalid UUID, skip
                }
            }
        }
    }

    @Transactional
    fun delete(id: UUID, userId: UUID) {
        val post = postRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Post not found") }

        require(post.user.id == userId) { "Unauthorized: You can only delete your own post" }

        postRepository.delete(post)
    }

    fun findBookmarkedPosts(userId: UUID): List<PostResponse> {
        return bookmarkRepository.findBookmarkedPosts(userId)
            .map { it.toResponse(userId) }
    }

    private fun Post.toResponse(currentUserId: UUID? = null): PostResponse {
        val photosWithCoords = photos.filter { it.latitude != null && it.longitude != null }
        val avgLat = photosWithCoords.mapNotNull { it.latitude }.takeIf { it.isNotEmpty() }?.average()
        val avgLng = photosWithCoords.mapNotNull { it.longitude }.takeIf { it.isNotEmpty() }?.average()

        val isLiked = currentUserId?.let {
            postLikeRepository.existsByUserIdAndPostId(it, id)
        } ?: false

        val isBookmarked = currentUserId?.let {
            bookmarkRepository.existsByUserIdAndPostId(it, id)
        } ?: false

        return PostResponse(
            id = id.toString(),
            title = title,
            contentSummary = contentSummary,
            likeCount = likeCount,
            cloneCount = cloneCount,
            createdAt = createdAt.toString(),
            username = user.username,
            photos = photos.map { photo ->
                PostPhotoResponse(
                    id = photo.id.toString(),
                    url = photo.imageUrl,
                    latitude = photo.latitude,
                    longitude = photo.longitude
                )
            },
            regionName = travel.regionName,
            latitude = avgLat,
            longitude = avgLng,
            isLiked = isLiked,
            isBookmarked = isBookmarked
        )
    }
}
