package com.vibelog.routes

import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import io.ktor.http.content.*
import com.vibelog.services.SupabaseService
import com.vibelog.models.*
import com.vibelog.plugins.dbQuery
import org.jetbrains.exposed.sql.*
import java.util.*
import com.drew.imaging.ImageMetadataReader
import com.drew.metadata.exif.ExifSubIFDDirectory
import com.drew.metadata.exif.GpsDirectory
import java.io.ByteArrayInputStream
import kotlinx.datetime.toKotlinLocalDateTime
import java.time.ZoneId
import kotlinx.serialization.Serializable

fun Route.photoRoutes(supabaseService: SupabaseService) {
    route("/photos") {
        
        // [Proxy + DB Save] 사진 업로드, 메타데이터 추출 및 DB 저장 통합
        post("/upload") {
            val multipart = call.receiveMultipart()
            var fileName = ""
            var fileBytes: ByteArray? = null
            var travelIdStr: String? = null
            var isSnapshotStr: String? = "false"

            multipart.forEachPart { part ->
                when (part) {
                    is PartData.FileItem -> {
                        fileName = part.originalFileName ?: "image.jpg"
                        fileBytes = part.streamProvider().readBytes()
                    }
                    is PartData.FormItem -> {
                        if (part.name == "travelId") travelIdStr = part.value
                        if (part.name == "isSnapshot") isSnapshotStr = part.value
                    }
                    else -> {}
                }
                part.dispose()
            }

            if (fileBytes != null && travelIdStr != null) {
                val travelId = UUID.fromString(travelIdStr)
                val isSnapshot = isSnapshotStr?.toBoolean() ?: false

                // 메타데이터 추출
                var latitude: Double? = null
                var longitude: Double? = null
                var capturedAt: kotlinx.datetime.LocalDateTime? = null

                try {
                    val metadata = ImageMetadataReader.readMetadata(ByteArrayInputStream(fileBytes))
                    
                    val gpsDir = metadata.getFirstDirectoryOfType(GpsDirectory::class.java)
                    if (gpsDir != null && gpsDir.geoLocation != null) {
                        latitude = gpsDir.geoLocation.latitude
                        longitude = gpsDir.geoLocation.longitude
                    }

                    val exifDir = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory::class.java)
                    val date = exifDir?.getDate(ExifSubIFDDirectory.TAG_DATETIME_ORIGINAL)
                    if (date != null) {
                        // Java Date -> kotlinx.datetime.LocalDateTime 변환
                        val instant = date.toInstant()
                        val javaLdt = java.time.LocalDateTime.ofInstant(instant, java.time.ZoneId.systemDefault())
                        capturedAt = kotlinx.datetime.LocalDateTime(
                            javaLdt.year, javaLdt.monthValue, javaLdt.dayOfMonth,
                            javaLdt.hour, javaLdt.minute, javaLdt.second
                        )
                    }
                } catch (e: Exception) {
                    println("메타데이터 추출 실패: ${e.message}")
                }

                // 1. S3 업로드
                val imageUrl = supabaseService.uploadToSupabase(fileName, fileBytes!!)
                
                if (imageUrl != null) {
                    // 2. DB 저장
                    val newPhotoId = dbQuery {
                        TravelPhotos.insert {
                            it[TravelPhotos.travelId] = travelId
                            it[TravelPhotos.imageUrl] = imageUrl
                            it[TravelPhotos.isSnapshot] = isSnapshot
                            it[TravelPhotos.latitude] = latitude
                            it[TravelPhotos.longitude] = longitude
                            it[TravelPhotos.capturedAt] = capturedAt
                        } get TravelPhotos.id
                    }

                    call.respond(mapOf(
                        "id" to newPhotoId.toString(),
                        "url" to imageUrl,
                        "latitude" to latitude,
                        "longitude" to longitude,
                        "capturedAt" to capturedAt?.toString()
                    ))
                } else {
                    call.respond(HttpStatusCode.InternalServerError, "Cloud Storage Upload Failed")
                }
            } else {
                call.respond(HttpStatusCode.BadRequest, "Missing file or travelId")
            }
        }
    }

    // 여행별 사진 관리 (Snapshot 반영)
    route("/travels/{id}/photos") {
        get {
            val travelId = UUID.fromString(call.parameters["id"])
            val photos = dbQuery {
                TravelPhotos.selectAll().where { TravelPhotos.travelId eq travelId }
                    .map { row ->
                        PhotoDTO(
                            id = row[TravelPhotos.id].toString(),
                            imageUrl = row[TravelPhotos.imageUrl],
                            isSnapshot = row[TravelPhotos.isSnapshot],
                            latitude = row[TravelPhotos.latitude],
                            longitude = row[TravelPhotos.longitude],
                            capturedAt = row[TravelPhotos.capturedAt]?.toString()
                        )
                    }
            }
            call.respond(photos)
        }

        post {
            val travelId = UUID.fromString(call.parameters["id"])
            val request = call.receive<SnapshotMetadataRequest>()

            val photoId = dbQuery {
                TravelPhotos.insert {
                    it[TravelPhotos.travelId] = travelId
                    it[TravelPhotos.imageUrl] = request.imageUrl
                    it[TravelPhotos.isSnapshot] = request.isSnapshot
                    it[TravelPhotos.latitude] = request.latitude
                    it[TravelPhotos.longitude] = request.longitude
                    it[TravelPhotos.capturedAt] = request.capturedAt?.let { ts -> kotlinx.datetime.LocalDateTime.parse(ts) }
                } get TravelPhotos.id
            }
            call.respond(HttpStatusCode.Created, mapOf("id" to photoId.toString()))
        }
    }
}

@Serializable
data class SnapshotMetadataRequest(
    val imageUrl: String,
    val isSnapshot: Boolean = true,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val capturedAt: String? = null
)
