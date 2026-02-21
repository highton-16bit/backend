package com.plog.controller

import com.plog.dto.*
import com.plog.service.PhotoService
import com.plog.service.TravelService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.util.*

@Tag(name = "Photos", description = "사진 관리 API")
@RestController
class PhotoController(
    private val photoService: PhotoService,
    private val travelService: TravelService
) {
    @Operation(summary = "사진 업로드", description = "Multipart 형식으로 사진을 업로드합니다. EXIF 메타데이터를 자동 추출합니다.")
    @PostMapping("/photos/upload", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun uploadPhoto(
        @RequestParam("file") file: MultipartFile,
        @RequestParam("travelId") travelId: String,
        @RequestParam(value = "isSnapshot", defaultValue = "false") isSnapshot: Boolean
    ): ResponseEntity<Any> {
        val travelUuid = try {
            UUID.fromString(travelId)
        } catch (e: Exception) {
            return ResponseEntity.badRequest().body(MessageResponse("Invalid travelId"))
        }

        val travel = travelService.findById(travelUuid)
            ?: return ResponseEntity.badRequest().body(MessageResponse("Invalid travelId"))

        return try {
            val response = photoService.upload(travel, file, isSnapshot)
            ResponseEntity.status(HttpStatus.CREATED).body(response)
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(MessageResponse("Upload failed: ${e.message}"))
        }
    }

    @Operation(summary = "여행별 사진 목록")
    @GetMapping("/travels/{id}/photos")
    fun getPhotos(@PathVariable id: UUID): ResponseEntity<List<PhotoResponse>> {
        return ResponseEntity.ok(photoService.findByTravelId(id))
    }

    @Operation(summary = "사진 메타데이터 등록", description = "URL 기반으로 사진 메타데이터를 등록합니다")
    @PostMapping("/travels/{id}/photos")
    fun createPhotoMetadata(
        @PathVariable id: UUID,
        @RequestBody request: PhotoMetadataRequest
    ): ResponseEntity<Any> {
        val travel = travelService.findById(id)
            ?: return ResponseEntity.badRequest().body(MessageResponse("Invalid ID"))

        val photoId = photoService.createWithMetadata(travel, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(IdResponse(photoId))
    }

    @Operation(
        summary = "사진 삭제",
        description = """
        여행에서 사진을 삭제합니다. S3 스토리지의 파일도 함께 삭제됩니다.

        **사용 화면:**
        - TravelsPage > Gallery > Photo Delete
        - NewPage > ShareMemory > Step3 (사진 제거)

        **관련 API:** GET /travels/{id}/photos, POST /photos/upload
        """
    )
    @DeleteMapping("/travels/{id}/photos/{photoId}")
    fun deletePhoto(
        @PathVariable id: UUID,
        @PathVariable photoId: UUID
    ): ResponseEntity<Any> {
        return try {
            photoService.delete(id, photoId)
            ResponseEntity.ok(MessageResponse("Deleted"))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(MessageResponse(e.message ?: "Invalid request"))
        }
    }
}
