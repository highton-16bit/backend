package com.plog.dto

import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalDate

@Schema(description = "여행 생성 요청")
data class TravelCreateRequest(
    @Schema(description = "여행 제목", example = "제주도 3박4일")
    val title: String,

    @Schema(description = "시작일", example = "2025-03-01")
    val startDate: LocalDate,

    @Schema(description = "종료일", example = "2025-03-04")
    val endDate: LocalDate,

    @Schema(description = "지역명", example = "제주도")
    val regionName: String? = null,

    @Schema(description = "공개 여부", example = "false")
    val isPublic: Boolean = false
)

@Schema(description = "여행 응답")
data class TravelResponse(
    val id: String,
    val title: String,
    val startDate: String,
    val endDate: String,
    val regionName: String?,
    val isPublic: Boolean
)

@Schema(description = "여행 수정 요청")
data class TravelUpdateRequest(
    @Schema(description = "여행 제목", example = "수정된 제주도 여행")
    val title: String? = null,

    @Schema(description = "시작일", example = "2025-03-01")
    val startDate: LocalDate? = null,

    @Schema(description = "종료일", example = "2025-03-04")
    val endDate: LocalDate? = null,

    @Schema(description = "지역명", example = "제주도, 성산")
    val regionName: String? = null,

    @Schema(description = "공개 여부", example = "true")
    val isPublic: Boolean? = null
)

@Schema(description = "일정 생성/수정 요청")
data class PlanCreateRequest(
    @Schema(description = "날짜", example = "2025-03-01")
    val date: LocalDate,

    @Schema(description = "시작 시간", example = "09:00")
    val startTime: String? = null,

    @Schema(description = "종료 시간", example = "12:00")
    val endTime: String? = null,

    @Schema(description = "메모", example = "성산일출봉 등반")
    val memo: String? = null,

    @Schema(description = "순서", example = "0")
    val orderIndex: Int = 0
)

@Schema(description = "일정 응답")
data class PlanResponse(
    val id: String,
    val date: String,
    val startTime: String?,
    val endTime: String?,
    val memo: String?
)
