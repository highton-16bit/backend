package com.vibelog.models

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.kotlin.datetime.CurrentDateTime
import org.jetbrains.exposed.sql.kotlin.datetime.date
import org.jetbrains.exposed.sql.kotlin.datetime.datetime
import java.util.*

// ============================================================
// Database Tables
// ============================================================

object Users : Table("users") {
    val id = uuid("id").clientDefault { UUID.randomUUID() }
    val username = text("username").uniqueIndex()
    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)

    override val primaryKey = PrimaryKey(id)
}

object Travels : Table("travels") {
    val id = uuid("id").clientDefault { UUID.randomUUID() }
    val userId = uuid("user_id").references(Users.id)
    val title = text("title")
    val startDate = date("start_date")
    val endDate = date("end_date")
    val regionName = text("region_name").nullable()
    val isPublic = bool("is_public").default(false)
    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)

    override val primaryKey = PrimaryKey(id)
}

object TravelPlanItems : Table("travel_plan_items") {
    val id = uuid("id").clientDefault { UUID.randomUUID() }
    val travelId = uuid("travel_id").references(Travels.id, onDelete = ReferenceOption.CASCADE)
    val date = date("date")
    val startTime = text("start_time").nullable()
    val endTime = text("end_time").nullable()
    val memo = text("memo").nullable()
    val orderIndex = integer("order_index").default(0)

    override val primaryKey = PrimaryKey(id)
}

object TravelPhotos : Table("travel_photos") {
    val id = uuid("id").clientDefault { UUID.randomUUID() }
    val travelId = uuid("travel_id").references(Travels.id)
    val imageUrl = text("image_url")
    val isSnapshot = bool("is_snapshot").default(false)
    val latitude = double("latitude").nullable()
    val longitude = double("longitude").nullable()
    val capturedAt = datetime("captured_at").nullable()
    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)

    override val primaryKey = PrimaryKey(id)
}

object Posts : Table("posts") {
    val id = uuid("id").clientDefault { UUID.randomUUID() }
    val travelId = uuid("travel_id").references(Travels.id)
    val userId = uuid("user_id").references(Users.id)
    val title = text("title")
    val contentSummary = text("content_summary").nullable()
    val likeCount = integer("like_count").default(0)
    val cloneCount = integer("clone_count").default(0)
    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)

    override val primaryKey = PrimaryKey(id)
}

object PostLikes : Table("post_likes") {
    val userId = uuid("user_id").references(Users.id)
    val postId = uuid("post_id").references(Posts.id, onDelete = ReferenceOption.CASCADE)

    override val primaryKey = PrimaryKey(userId, postId)
}

object Bookmarks : Table("bookmarks") {
    val userId = uuid("user_id").references(Users.id)
    val postId = uuid("post_id").references(Posts.id, onDelete = ReferenceOption.CASCADE)
    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)

    override val primaryKey = PrimaryKey(userId, postId)
}

object PostPhotoMappings : Table("post_photo_mappings") {
    val postId = uuid("post_id").references(Posts.id, onDelete = ReferenceOption.CASCADE)
    val photoId = uuid("photo_id").references(TravelPhotos.id)

    override val primaryKey = PrimaryKey(postId, photoId)
}

// ============================================================
// Request DTOs
// ============================================================

@Serializable
data class AuthRequest(
    val username: String
)

@Serializable
data class TravelCreateRequest(
    val title: String,
    val startDate: String,
    val endDate: String,
    val regionName: String? = null,
    val isPublic: Boolean = false
)

@Serializable
data class PlanCreateRequest(
    val date: String,
    val startTime: String? = null,
    val endTime: String? = null,
    val memo: String? = null,
    val orderIndex: Int = 0
)

@Serializable
data class PostCreateRequest(
    val travelId: String,
    val title: String,
    val photoIds: List<String> = emptyList()
)

@Serializable
data class PhotoMetadataRequest(
    val imageUrl: String,
    val isSnapshot: Boolean = false,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val capturedAt: String? = null
)

// ============================================================
// Response DTOs
// ============================================================

@Serializable
data class TravelResponse(
    val id: String,
    val title: String,
    val startDate: String,
    val endDate: String,
    val regionName: String?,
    val isPublic: Boolean
)

@Serializable
data class PlanResponse(
    val id: String,
    val date: String,
    val startTime: String?,
    val endTime: String?,
    val memo: String?
)

@Serializable
data class PhotoResponse(
    val id: String,
    val imageUrl: String,
    val isSnapshot: Boolean,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val capturedAt: String? = null
)

@Serializable
data class PostPhotoResponse(
    val id: String,
    val url: String
)

@Serializable
data class PostResponse(
    val id: String,
    val title: String,
    val contentSummary: String?,
    val likeCount: Int,
    val cloneCount: Int,
    val createdAt: String,
    val username: String?,
    val photos: List<PostPhotoResponse>
)

@Serializable
data class PostListResponse(
    val posts: List<PostResponse>
)

@Serializable
data class PostCreateResponse(
    val id: String,
    val summary: String
)

@Serializable
data class PhotoUploadResponse(
    val id: String,
    val url: String,
    val latitude: Double?,
    val longitude: Double?,
    val capturedAt: String?
)

@Serializable
data class SearchPostItem(
    val id: String,
    val title: String,
    val summary: String?
)

@Serializable
data class AISearchResponse(
    val query: String,
    val answer: String,
    val relatedPosts: List<SearchPostItem>
)

@Serializable
data class CloneResponse(
    val travelId: String,
    val planItems: List<PlanResponse>
)

@Serializable
data class IdResponse(
    val id: String
)

@Serializable
data class MessageResponse(
    val message: String
)
