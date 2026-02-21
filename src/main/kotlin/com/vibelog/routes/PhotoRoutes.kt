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

fun Route.photoRoutes(supabaseService: SupabaseService) {
    route("/photos") {
        
        // [Proxy] 사진 업로드
        post("/upload") {
            val multipart = call.receiveMultipart()
            var fileName = ""
            var fileBytes: ByteArray? = null

            multipart.forEachPart { part ->
                if (part is PartData.FileItem) {
                    fileName = part.originalFileName ?: "image.jpg"
                    fileBytes = part.streamProvider().readBytes()
                }
                part.dispose()
            }

            if (fileBytes != null) {
                val imageUrl = supabaseService.uploadToSupabase(fileName, fileBytes!!)
                if (imageUrl != null) {
                    call.respond(mapOf("url" to imageUrl))
                } else {
                    call.respond(HttpStatusCode.InternalServerError, "Cloud Storage Upload Failed")
                }
            } else {
                call.respond(HttpStatusCode.BadRequest, "No file uploaded")
            }
        }
    }

    // 여행별 사진 관리 (Snapshot 반영)
    route("/travels/{id}/photos") {
        get {
            val travelId = UUID.fromString(call.parameters["id"])
            val photos = dbQuery {
                TravelPhotos.select { TravelPhotos.travelId eq travelId }
                    .map { row ->
                        mapOf(
                            "id" to row[TravelPhotos.id].toString(),
                            "imageUrl" to row[TravelPhotos.imageUrl],
                            "isSnapshot" to row[TravelPhotos.isSnapshot]
                        )
                    }
            }
            call.respond(photos)
        }

        post {
            val travelId = UUID.fromString(call.parameters["id"])
            val request = call.receive<SnapshotRegisterRequest>()
            
            val photoId = dbQuery {
                TravelPhotos.insert {
                    it[TravelPhotos.travelId] = travelId
                    it[TravelPhotos.imageUrl] = request.imageUrl
                    it[TravelPhotos.isSnapshot] = request.isSnapshot
                } get TravelPhotos.id
            }
            call.respond(HttpStatusCode.Created, mapOf("id" to photoId.toString()))
        }
    }
}
