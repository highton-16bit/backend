package com.plog.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import java.net.URI
import java.util.*

@Service
class SupabaseService(
    @Value("\${storage.s3-endpoint:}") private val endpoint: String,
    @Value("\${storage.s3-region:}") private val region: String,
    @Value("\${storage.s3-bucket:photos}") private val bucketName: String,
    @Value("\${storage.s3-access-key:}") private val accessKey: String,
    @Value("\${storage.s3-secret-key:}") private val secretKey: String
) {
    private val s3Client: S3Client? by lazy {
        if (endpoint.isBlank() || accessKey.isBlank() || secretKey.isBlank()) {
            null
        } else {
            S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region.ifBlank { "us-east-1" }))
                .credentialsProvider(
                    StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)
                    )
                )
                .forcePathStyle(true)
                .build()
        }
    }

    fun upload(fileName: String, fileBytes: ByteArray): String? {
        val client = s3Client ?: return null

        val extension = fileName.substringAfterLast(".", "jpg")
        val uniquePath = "${UUID.randomUUID()}.$extension"

        return try {
            val putRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(uniquePath)
                .contentType("image/$extension")
                .build()

            client.putObject(putRequest, RequestBody.fromBytes(fileBytes))

            // 수파베이스 퍼블릭 버킷 URL 조합
            val baseUrl = endpoint.replace("/storage/v1/s3", "")
            "$baseUrl/storage/v1/object/public/$bucketName/$uniquePath"
        } catch (e: Exception) {
            println("Supabase S3 업로드 실패: ${e.message}")
            null
        }
    }
}
