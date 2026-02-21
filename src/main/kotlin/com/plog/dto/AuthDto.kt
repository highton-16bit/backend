package com.plog.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "인증 요청")
data class AuthRequest(
    @Schema(description = "사용자명", example = "john_doe")
    val username: String
)
