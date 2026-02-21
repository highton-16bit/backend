package com.vibelog.services

import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import java.util.*

class SupabaseService(
    private val supabaseUrl: String,
    private val supabaseKey: String
) {
    private val client = HttpClient {
        install(ContentNegotiation) {
            json()
        }
    }

    /**
     * 프론트에서 받은 파일을 수파베이스 스토리지에 업로드하고 퍼블릭 URL 반환
     */
    suspend fun uploadToSupabase(fileName: String, fileBytes: ByteArray): String? {
        val bucketName = "photos"
        val extension = fileName.substringAfterLast(".", "jpg")
        val uniquePath = "${UUID.randomUUID()}.$extension"
        
        return try {
            val response: HttpResponse = client.post("$supabaseUrl/storage/v1/object/$bucketName/$uniquePath") {
                header("Authorization", "Bearer $supabaseKey")
                header("apikey", supabaseKey)
                contentType(ContentType.parse("image/$extension"))
                setBody(fileBytes)
            }

            if (response.status == HttpStatusCode.OK) {
                // 업로드 성공 시 퍼블릭 URL 조합해서 반환
                "$supabaseUrl/storage/v1/object/public/$bucketName/$uniquePath"
            } else {
                null
            }
        } catch (e: Exception) {
            println("Supabase 업로드 실패: ${e.message}")
            null
        }
    }
}
