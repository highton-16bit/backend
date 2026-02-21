package com.vibelog.routes

import com.drew.imaging.ImageMetadataReader
import com.drew.metadata.exif.ExifSubIFDDirectory
import com.drew.metadata.exif.GpsDirectory
import com.vibelog.models.*
import com.vibelog.plugins.dbQuery
import com.vibelog.services.SupabaseService
import io.ktor.http.*
import io.ktor.http.content.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.datetime.LocalDateTime
import org.jetbrains.exposed.sql.*
import java.io.ByteArrayInputStream
import java.util.*

fun Route.photoRoutes(supabaseService: SupabaseService) {

    // 사진 업로드 (Multipart)
    route("/photos") {
        post("/upload") {
            val multipart = call.receiveMultipart()

            var fileName = ""
            var fileBytes: ByteArray? = null
            var travelIdStr: String? = null
            var isSnapshotStr = "false"

            multipart.forEachPart { part ->
                when (part) {
                    is PartData.FileItem -> {
                        fileName = part.originalFileName ?: "image.jpg"
                        fileBytes = part.streamProvider().readBytes()
                    }
                    is PartData.FormItem -> {
                        when (part.name) {
                            "travelId" -> travelIdStr = part.value
                            "isSnapshot" -> isSnapshotStr = part.value
                        }
                    }
                    else -> {}
                }
                part.dispose()
            }

            if (fileBytes == null || travelIdStr == null) {
                call.respond(HttpStatusCode.BadRequest, MessageResponse("Missing file or travelId"))
                return@post
            }

            val travelId = travelIdStr!!.toUuidOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, MessageResponse("Invalid travelId"))

            val isSnapshot = isSnapshotStr.toBoolean()

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
                    val instant = date.toInstant()
                    val javaLdt = java.time.LocalDateTime.ofInstant(instant, java.time.ZoneId.systemDefault())
                    capturedAt = LocalDateTime(
                        javaLdt.year, javaLdt.monthValue, javaLdt.dayOfMonth,
                        javaLdt.hour, javaLdt.minute, javaLdt.second
                    )
                }
            } catch (e: Exception) {
                // 메타데이터 추출 실패 - 무시하고 계속 진행
            }

            // S3 업로드
            val imageUrl = supabaseService.uploadToSupabase(fileName, fileBytes!!)
                ?: return@post call.respond(HttpStatusCode.InternalServerError, MessageResponse("Upload failed"))

            // DB 저장
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

            call.respond(
                HttpStatusCode.Created,
                PhotoUploadResponse(
                    id = newPhotoId.toString(),
                    url = imageUrl,
                    latitude = latitude,
                    longitude = longitude,
                    capturedAt = capturedAt?.toString()
                )
            )
        }
    }

    // 여행별 사진
    route("/travels/{id}/photos") {

        // 사진 목록
        get {
            val travelId = call.parameters["id"]?.toUuidOrNull()
                ?: return@get call.respond(HttpStatusCode.BadRequest, MessageResponse("Invalid ID"))

            val photos = dbQuery {
                TravelPhotos.selectAll()
                    .where { TravelPhotos.travelId eq travelId }
                    .map { row ->
                        PhotoResponse(
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

        // 사진 메타데이터 등록 (URL 기반)
        post {
            val travelId = call.parameters["id"]?.toUuidOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, MessageResponse("Invalid ID"))

            val request = call.receive<PhotoMetadataRequest>()

            val capturedAt = request.capturedAt?.let {
                try {
                    LocalDateTime.parse(it)
                } catch (e: Exception) {
                    null
                }
            }

            val newId = dbQuery {
                TravelPhotos.insert {
                    it[TravelPhotos.travelId] = travelId
                    it[imageUrl] = request.imageUrl
                    it[isSnapshot] = request.isSnapshot
                    it[latitude] = request.latitude
                    it[longitude] = request.longitude
                    it[TravelPhotos.capturedAt] = capturedAt
                } get TravelPhotos.id
            }

            call.respond(HttpStatusCode.Created, IdResponse(newId.toString()))
        }
    }
}

private fun String.toUuidOrNull(): UUID? = try {
    UUID.fromString(this)
} catch (e: Exception) {
    null
}
