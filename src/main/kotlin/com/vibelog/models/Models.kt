package com.vibelog.models

import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.kotlin.datetime.date
import org.jetbrains.exposed.sql.kotlin.datetime.datetime
import kotlinx.serialization.Serializable
import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalDateTime
import java.util.*

// 1. 유저 테이블 (Users)
object Users : Table("users") {
    val id = uuid("id").clientDefault { UUID.randomUUID() }
    val username = text("username").uniqueIndex()
    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)
    
    override val primaryKey = PrimaryKey(id)
}

// 2. 여행 대장 테이블 (Travels)
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

// 3. 여행 상세 계획 테이블 (TravelPlanItems)
object TravelPlanItems : Table("travel_plan_items") {
    val id = uuid("id").clientDefault { UUID.randomUUID() }
    val travelId = uuid("travel_id").references(Travels.id, onDelete = ReferenceOption.CASCADE)
    val date = date("date")
    val time = text("time").nullable()
    val placeName = text("place_name")
    val memo = text("memo").nullable()
    val orderIndex = integer("order_index").default(0)
    
    override val primaryKey = PrimaryKey(id)
}

// 4. 여행 사진 테이블 (TravelPhotos)
object TravelPhotos : Table("travel_photos") {
    val id = uuid("id").clientDefault { UUID.randomUUID() }
    val travelId = uuid("travel_id").references(Travels.id)
    val imageUrl = text("image_url")
    val isJoyMode = bool("is_joy_mode").default(false)
    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)
    
    override val primaryKey = PrimaryKey(id)
}

// 5. 게시글 테이블 (Posts)
object Posts : Table("posts") {
    val id = uuid("id").clientDefault { UUID.randomUUID() }
    val travelId = uuid("travel_id").references(Travels.id)
    val userId = uuid("user_id").references(Users.id)
    val title = text("title")
    val contentSummary = text("content_summary").nullable()
    val likeCount = integer("like_count").default(0)
    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)
    
    override val primaryKey = PrimaryKey(id)
}

// 6. 게시글 사진 매핑
object PostPhotoMappings : Table("post_photo_mappings") {
    val postId = uuid("post_id").references(Posts.id, onDelete = ReferenceOption.CASCADE)
    val photoId = uuid("photo_id").references(TravelPhotos.id)
}

// --- DTOs ---

@Serializable
data class AuthRequest(val username: String)

@Serializable
data class TravelDTO(
    val id: String,
    val title: String,
    val startDate: String,
    val endDate: String,
    val regionName: String?,
    val isPublic: Boolean
)

@Serializable
data class TravelCreateRequest(
    val title: String,
    val startDate: String,
    val endDate: String,
    val regionName: String?,
    val isPublic: Boolean = false
)

@Serializable
data class PlanItemDTO(
    val id: String,
    val date: String,
    val time: String?,
    val placeName: String,
    val memo: String?,
    val orderIndex: Int
)

@Serializable
data class PhotoRegisterRequest(
    val imageUrl: String,
    val isJoyMode: Boolean = false
)
