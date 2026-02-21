package com.vibelog.plugins

import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.routing.*
import java.io.File
import java.util.*

fun Application.configureStaticResources() {
    routing {
        // http://localhost:8080/uploads/filename.jpg 로 사진 확인 가능
        static("/uploads") {
            files("uploads")
        }
    }
}

fun saveFileToLocal(fileName: String, fileBytes: ByteArray): String {
    val extension = fileName.substringAfterLast(".", "jpg")
    val uniqueName = "${UUID.randomUUID()}.$extension"
    val file = File("uploads/$uniqueName")
    file.writeBytes(fileBytes)
    return "/uploads/$uniqueName"
}
