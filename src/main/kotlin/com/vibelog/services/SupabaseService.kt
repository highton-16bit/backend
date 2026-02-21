package com.vibelog.services

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import java.net.URI
import java.util.*

class SupabaseService(
    private val endpoint: String,
    private val region: String,
    private val accessKey: String,
    private val secretKey: String
) {
    private val s3Client: S3Client = S3Client.builder()
        .endpointOverride(URI.create(endpoint))
        .region(Region.of(region))
        .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
        .forcePathStyle(true) // 수파베이스 S3는 패스 스타일(bucket/object) 강제 필수
        .build()

    private val bucketName = "photos"

    /**
     * 파일을 S3 호환 프로토콜을 통해 업로드하고 퍼블릭 URL을 반환
     */
    suspend fun uploadToSupabase(fileName: String, fileBytes: ByteArray): String? {
        val extension = fileName.substringAfterLast(".", "jpg")
        val uniquePath = "${UUID.randomUUID()}.$extension"
        
        return try {
            val putRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(uniquePath)
                .contentType("image/$extension")
                .build()

            s3Client.putObject(putRequest, RequestBody.fromBytes(fileBytes))

            // 수파베이스 퍼블릭 버킷인 경우: 프로젝트 URL을 기반으로 퍼블릭 접근 경로 조합
            // S3 엔드포인트에서 /storage/v1/s3 를 뺀 기본 URL을 조합
            val baseUrl = endpoint.replace("/storage/v1/s3", "")
            "$baseUrl/storage/v1/object/public/$bucketName/$uniquePath"
        } catch (e: Exception) {
            println("Supabase S3 업로드 실패: ${e.message}")
            null
        }
    }
}
