package com.plog.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "사진 URL 등록 요청")
data class PhotoUrlRequest(
    @Schema(description = "이미지 URL (S3 업로드 후 반환된 URL)")
    val imageUrl: String,

    @Schema(description = "스냅샷 여부")
    val isSnapshot: Boolean = false
)

@Schema(description = "S3 업로드 응답")
data class S3UploadResponse(
    val url: String
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
