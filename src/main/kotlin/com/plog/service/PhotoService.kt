package com.plog.service

import com.drew.imaging.ImageMetadataReader
import com.drew.metadata.exif.ExifSubIFDDirectory
import com.drew.metadata.exif.GpsDirectory
import com.plog.dto.*
import com.plog.entity.Travel
import com.plog.entity.TravelPhoto
import com.plog.repository.TravelPhotoRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.io.ByteArrayInputStream
import java.net.URI
import java.time.LocalDateTime
import java.time.ZoneId
import java.util.*

@Service
@Transactional(readOnly = true)
class PhotoService(
    private val photoRepository: TravelPhotoRepository,
    private val supabaseService: SupabaseService
) {
    fun findByTravelId(travelId: UUID): List<PhotoResponse> {
        return photoRepository.findByTravelIdOrderByCreatedAtAsc(travelId).map { it.toResponse() }
    }

    /**
     * S3에만 업로드하고 URL만 반환 (DB 저장 X)
     */
    @Transactional
    fun uploadToS3Only(file: MultipartFile): S3UploadResponse {
        val fileBytes = file.bytes
        val fileName = file.originalFilename ?: "image.jpg"

        val imageUrl = supabaseService.upload(fileName, fileBytes)
            ?: throw RuntimeException("Upload failed")

        return S3UploadResponse(url = imageUrl)
    }

    /**
     * URL에서 이미지를 다운로드하여 메타데이터 추출 후 DB에 저장
     */
    @Transactional
    fun registerFromUrl(travel: Travel, imageUrl: String, isSnapshot: Boolean): String {
        var latitude: Double? = null
        var longitude: Double? = null
        var capturedAt: LocalDateTime? = null

        // URL에서 이미지 다운로드 후 메타데이터 추출
        try {
            val imageBytes = URI.create(imageUrl).toURL().readBytes()
            val extractedMeta = extractMetadata(imageBytes)
            latitude = extractedMeta.latitude
            longitude = extractedMeta.longitude
            capturedAt = extractedMeta.capturedAt
        } catch (e: Exception) {
            // 메타데이터 추출 실패 - 무시하고 계속 진행
        }

        val photo = TravelPhoto(
            travel = travel,
            imageUrl = imageUrl,
            isSnapshot = isSnapshot,
            latitude = latitude,
            longitude = longitude,
            capturedAt = capturedAt
        )

        return photoRepository.save(photo).id.toString()
    }

    /**
     * 레거시: 파일 업로드 + DB 저장 (기존 호환용)
     */
    @Transactional
    fun uploadAndSave(travel: Travel, file: MultipartFile, isSnapshot: Boolean): PhotoUploadResponse {
        val fileBytes = file.bytes
        val fileName = file.originalFilename ?: "image.jpg"

        // 메타데이터 추출
        val meta = extractMetadata(fileBytes)

        // S3 업로드
        val imageUrl = supabaseService.upload(fileName, fileBytes)
            ?: throw RuntimeException("Upload failed")

        // DB 저장
        val photo = TravelPhoto(
            travel = travel,
            imageUrl = imageUrl,
            isSnapshot = isSnapshot,
            latitude = meta.latitude,
            longitude = meta.longitude,
            capturedAt = meta.capturedAt
        )

        val saved = photoRepository.save(photo)

        return PhotoUploadResponse(
            id = saved.id.toString(),
            url = imageUrl,
            latitude = meta.latitude,
            longitude = meta.longitude,
            capturedAt = meta.capturedAt?.toString()
        )
    }

    /**
     * 이미지 바이트에서 EXIF 메타데이터 추출
     */
    private fun extractMetadata(fileBytes: ByteArray): PhotoMetadata {
        var latitude: Double? = null
        var longitude: Double? = null
        var capturedAt: LocalDateTime? = null

        try {
            val metadata = ImageMetadataReader.readMetadata(ByteArrayInputStream(fileBytes))

            val gpsDir = metadata.getFirstDirectoryOfType(GpsDirectory::class.java)
            if (gpsDir?.geoLocation != null) {
                latitude = gpsDir.geoLocation.latitude
                longitude = gpsDir.geoLocation.longitude
            }

            val exifDir = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory::class.java)
            val date = exifDir?.getDate(ExifSubIFDDirectory.TAG_DATETIME_ORIGINAL)
            if (date != null) {
                capturedAt = date.toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDateTime()
            }
        } catch (e: Exception) {
            // 메타데이터 추출 실패 - 무시
        }

        return PhotoMetadata(latitude, longitude, capturedAt)
    }

    private data class PhotoMetadata(
        val latitude: Double?,
        val longitude: Double?,
        val capturedAt: LocalDateTime?
    )

    @Transactional
    fun delete(travelId: UUID, photoId: UUID) {
        val photo = photoRepository.findById(photoId)
            .orElseThrow { IllegalArgumentException("Photo not found") }

        require(photo.travel.id == travelId) { "Photo does not belong to this travel" }

        // S3에서 파일 삭제 시도
        try {
            supabaseService.delete(photo.imageUrl)
        } catch (e: Exception) {
            // S3 삭제 실패해도 DB에서는 삭제 진행
        }

        photoRepository.delete(photo)
    }

    private fun TravelPhoto.toResponse() = PhotoResponse(
        id = id.toString(),
        imageUrl = imageUrl,
        isSnapshot = isSnapshot,
        latitude = latitude,
        longitude = longitude,
        capturedAt = capturedAt?.toString()
    )
}
