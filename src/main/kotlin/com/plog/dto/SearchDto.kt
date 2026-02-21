package com.plog.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "검색 결과 게시글 항목")
data class SearchPostItem(
    val id: String,
    val title: String,
    val summary: String?,
    val regionName: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val likeCount: Int = 0,
    val photoUrl: String? = null
)

@Schema(description = "AI 검색 응답")
data class AISearchResponse(
    val query: String,
    val answer: String,
    val relatedPosts: List<SearchPostItem>
)

@Schema(description = "지역 검색 응답")
data class RegionSearchResponse(
    val query: String,
    val regionName: String?,
    val posts: List<SearchPostItem>,
    val mapPins: List<MapPin>
)

@Schema(description = "지도 핀")
data class MapPin(
    val postId: String,
    val title: String,
    val latitude: Double,
    val longitude: Double,
    val photoUrl: String? = null
)

@Schema(description = "클론 응답")
data class CloneResponse(
    val travelId: String,
    val planItems: List<PlanResponse>
)
