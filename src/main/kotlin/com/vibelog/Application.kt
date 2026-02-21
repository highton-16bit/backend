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

fun main(args: Array<String>): Unit = io.ktor.server.netty.EngineMain.main(args)

fun Application.module() {
    // 수파베이스 접속 정보 (application.conf에서 로드)
    val supabaseUrl = environment.config.propertyOrNull("storage.supabaseUrl")?.getString() ?: "" 
    val supabaseKey = environment.config.propertyOrNull("storage.supabaseKey")?.getString() ?: "" 
    val supabaseService = SupabaseService(supabaseUrl, supabaseKey)

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
    
    routing {
        get("/") {
            call.respond(mapOf("status" to "OK", "message" to "Welcome to Plog Ktor API!"))
        }
        
        authRoutes()
        travelRoutes()
        postRoutes()
        searchRoutes(geminiApiKey)
        photoRoutes(supabaseService)
    }
}
