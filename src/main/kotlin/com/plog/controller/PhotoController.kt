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
    @Operation(
        summary = "S3 사진 업로드 (프록시)",
        description = """
        파일을 S3에 업로드하고 URL만 반환합니다. DB에 저장하지 않습니다.
        여행에 사진을 등록하려면 반환된 URL로 POST /travels/{id}/photos를 호출하세요.

        **사용 화면:** PhotoUploader, Gallery
        **관련 API:** POST /travels/{id}/photos (URL로 여행에 사진 등록)
        """
    )
    @PostMapping("/photos/upload", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun uploadToS3(
        @RequestParam("file") file: MultipartFile
    ): ResponseEntity<Any> {
        return try {
            val response = photoService.uploadToS3Only(file)
            ResponseEntity.status(HttpStatus.CREATED).body(response)
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(MessageResponse("Upload failed: ${e.message}"))
        }
    }

    @Operation(
        summary = "사진 업로드 (레거시)",
        description = "파일을 업로드하고 바로 여행에 등록합니다. (기존 호환용)"
    )
    @PostMapping("/photos/upload/legacy", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun uploadPhotoLegacy(
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
            val response = photoService.uploadAndSave(travel, file, isSnapshot)
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

    @Operation(
        summary = "여행에 사진 등록",
        description = """
        URL로 사진을 여행에 등록합니다.
        이미지를 다운로드하여 EXIF 메타데이터(GPS, 촬영시간)를 자동 추출합니다.

        **사용 화면:** Gallery, PostEditor
        **관련 API:** POST /photos/upload (S3 업로드), GET /travels/{id}/photos
        """
    )
    @PostMapping("/travels/{id}/photos")
    fun registerPhoto(
        @PathVariable id: UUID,
        @RequestBody request: PhotoUrlRequest
    ): ResponseEntity<Any> {
        val travel = travelService.findById(id)
            ?: return ResponseEntity.badRequest().body(MessageResponse("Invalid ID"))

        return try {
            val photoId = photoService.registerFromUrl(travel, request.imageUrl, request.isSnapshot)
            ResponseEntity.status(HttpStatus.CREATED).body(IdResponse(photoId))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(MessageResponse("Failed to register photo: ${e.message}"))
        }
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
