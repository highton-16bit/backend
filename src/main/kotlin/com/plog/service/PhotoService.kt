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
        return photoRepository.findByTravelId(travelId).map { it.toResponse() }
    }

    @Transactional
    fun upload(travel: Travel, file: MultipartFile, isSnapshot: Boolean): PhotoUploadResponse {
        val fileBytes = file.bytes
        val fileName = file.originalFilename ?: "image.jpg"

        // 메타데이터 추출
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
            // 메타데이터 추출 실패 - 무시하고 계속 진행
        }

        // S3 업로드
        val imageUrl = supabaseService.upload(fileName, fileBytes)
            ?: throw RuntimeException("Upload failed")

        // DB 저장
        val photo = TravelPhoto(
            travel = travel,
            imageUrl = imageUrl,
            isSnapshot = isSnapshot,
            latitude = latitude,
            longitude = longitude,
            capturedAt = capturedAt
        )

        val saved = photoRepository.save(photo)

        return PhotoUploadResponse(
            id = saved.id.toString(),
            url = imageUrl,
            latitude = latitude,
            longitude = longitude,
            capturedAt = capturedAt?.toString()
        )
    }

    @Transactional
    fun createWithMetadata(travel: Travel, request: PhotoMetadataRequest): String {
        val capturedAt = request.capturedAt?.let {
            try {
                LocalDateTime.parse(it)
            } catch (e: Exception) {
                null
            }
        }

        val photo = TravelPhoto(
            travel = travel,
            imageUrl = request.imageUrl,
            isSnapshot = request.isSnapshot,
            latitude = request.latitude,
            longitude = request.longitude,
            capturedAt = capturedAt
        )

        return photoRepository.save(photo).id.toString()
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
