package com.plog.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "게시글 생성 요청")
data class PostCreateRequest(
    @Schema(description = "여행 ID")
    val travelId: String,

    @Schema(description = "게시글 제목", example = "제주도 여행 후기")
    val title: String,

    @Schema(description = "본문 내용", example = "제주도에서의 멋진 여행 기록입니다.")
    val content: String? = null,

    @Schema(description = "첨부할 사진 ID 목록")
    val photoIds: List<String> = emptyList()
)

@Schema(description = "게시글 수정 요청")
data class PostUpdateRequest(
    @Schema(description = "게시글 제목", example = "수정된 제주도 여행 후기")
    val title: String? = null,

    @Schema(description = "본문 내용 (AI 요약 대신 직접 작성)", example = "직접 작성한 여행 후기입니다...")
    val contentSummary: String? = null,

    @Schema(description = "사진 ID 목록 (순서대로)")
    val photoIds: List<String>? = null
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
    val longitude: Double? = null,

    @Schema(description = "현재 사용자의 좋아요 여부")
    val isLiked: Boolean = false,

    @Schema(description = "현재 사용자의 북마크 여부")
    val isBookmarked: Boolean = false
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
