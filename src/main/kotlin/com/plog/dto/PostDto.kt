package com.plog.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "게시글 생성 요청")
data class PostCreateRequest(
    @Schema(description = "여행 ID")
    val travelId: String,

    @Schema(description = "게시글 제목", example = "제주도 여행 후기")
    val title: String,

    @Schema(description = "첨부할 사진 ID 목록")
    val photoIds: List<String> = emptyList()
)

@Schema(description = "게시글 응답")
data class PostResponse(
    val id: String,
    val title: String,
    val contentSummary: String?,
    val likeCount: Int,
    val cloneCount: Int,
    val createdAt: String,
    val username: String?,
    val photos: List<PostPhotoResponse>,
    val regionName: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null
)

@Schema(description = "게시글 사진 응답")
data class PostPhotoResponse(
    val id: String,
    val url: String,
    val latitude: Double? = null,
    val longitude: Double? = null
)

@Schema(description = "게시글 목록 응답")
data class PostListResponse(
    val posts: List<PostResponse>
)

@Schema(description = "게시글 생성 응답")
data class PostCreateResponse(
    val id: String,
    val summary: String
)
