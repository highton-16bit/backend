package com.plog.dto

import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant

@Schema(description = "ID 응답")
data class IdResponse(
    val id: String
)

@Schema(description = "메시지 응답")
data class MessageResponse(
    val message: String,
    val timestamp: String = Instant.now().toString()
)
