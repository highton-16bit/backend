package com.vibelog

import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.json.Json
import com.vibelog.plugins.*
import com.vibelog.routes.*
import com.vibelog.services.SupabaseService
import com.vibelog.services.GeminiService

fun main(args: Array<String>): Unit = io.ktor.server.netty.EngineMain.main(args)

fun Application.module() {
    // 수파베이스 S3 호환 접속 정보 (application.conf에서 로드)
    val s3Endpoint = environment.config.propertyOrNull("storage.s3Endpoint")?.getString() ?: "" 
    val s3Region = environment.config.propertyOrNull("storage.s3Region")?.getString() ?: "" 
    val s3Bucket = environment.config.propertyOrNull("storage.s3Bucket")?.getString() ?: "photos" 
    val s3AccessKey = environment.config.propertyOrNull("storage.s3AccessKey")?.getString() ?: "" 
    val s3SecretKey = environment.config.propertyOrNull("storage.s3SecretKey")?.getString() ?: "" 
    val supabaseService = SupabaseService(s3Endpoint, s3Region, s3Bucket, s3AccessKey, s3SecretKey)

    configureCORS()
    configureSerialization()
    configureDatabase()
    configureStaticResources()
    configureSwagger()
    configureRouting(supabaseService)
}

fun Application.configureCORS() {
    install(CORS) {
        anyHost()
        allowHeader("Content-Type")
        allowHeader("Authorization")
        allowMethod(io.ktor.http.HttpMethod.Options)
        allowMethod(io.ktor.http.HttpMethod.Get)
        allowMethod(io.ktor.http.HttpMethod.Post)
        allowMethod(io.ktor.http.HttpMethod.Put)
        allowMethod(io.ktor.http.HttpMethod.Patch) // PATCH 추가
        allowMethod(io.ktor.http.HttpMethod.Delete)
    }
}

fun Application.configureSerialization() {
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
            ignoreUnknownKeys = true
        })
    }
}

fun Application.configureRouting(supabaseService: SupabaseService) {
    val geminiApiKey = environment.config.propertyOrNull("gemini.apiKey")?.getString() ?: ""
    val geminiService = GeminiService(geminiApiKey)
    
    routing {
        get("/") {
            call.respond(mapOf("status" to "OK", "message" to "Welcome to Plog Ktor API!"))
        }
        
        authRoutes()
        travelRoutes()
        postRoutes(geminiService)
        searchRoutes(geminiService)
        photoRoutes(supabaseService)
    }
}
