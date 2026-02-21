package com.plog.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "사진 메타데이터 요청")
data class PhotoMetadataRequest(
    @Schema(description = "이미지 URL")
    val imageUrl: String,

    @Schema(description = "스냅샷 여부")
    val isSnapshot: Boolean = false,

    @Schema(description = "위도")
    val latitude: Double? = null,

    @Schema(description = "경도")
    val longitude: Double? = null,

    @Schema(description = "촬영 시간")
    val capturedAt: String? = null
)

@Schema(description = "사진 응답")
data class PhotoResponse(
    val id: String,
    val imageUrl: String,
    val isSnapshot: Boolean,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val capturedAt: String? = null
)

@Schema(description = "사진 업로드 응답")
data class PhotoUploadResponse(
    val id: String,
    val url: String,
    val latitude: Double?,
    val longitude: Double?,
    val capturedAt: String?
)
