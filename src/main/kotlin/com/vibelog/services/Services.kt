package com.vibelog.services

import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.*
import java.util.*

class GeminiService(private val apiKey: String) {
    private val client = HttpClient {
        install(ContentNegotiation) {
            json()
        }
    }

    private val apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$apiKey"

    suspend fun summarizeTravel(plans: List<Map<String, String?>>): String? {
        if (apiKey.isEmpty() || plans.isEmpty()) return null
        val prompt = "다음은 한 여행의 일정 데이터야. 이 일정들을 기반으로 블로그 포스팅처럼 감성적이고 읽기 좋게 요약해줘: $plans"
        return callGemini(prompt)
    }

    suspend fun parseTravelContent(content: String): String? {
        if (apiKey.isEmpty()) return null
        val prompt = """
            다음 여행 요약글을 읽고 일별 계획(date, time, place_name, memo)을 추출해줘. 
            응답은 반드시 JSON 리스트 형식이어야 해. 
            날짜는 '2026-03-01' 형식, 시간은 'HH:mm' 또는 null로 해줘.
            요약글: $content
        """.trimIndent()
        return callGemini(prompt)
    }

    private suspend fun callGemini(prompt: String): String? {
        return try {
            val response = client.post(apiUrl) {
                contentType(ContentType.Application.Json)
                setBody(buildJsonObject {
                    putJsonArray("contents") {
                        addJsonObject {
                            putJsonArray("parts") {
                                addJsonObject { put("text", prompt) }
                            }
                        }
                    }
                })
            }
            val body = Json.parseToJsonElement(response.bodyAsText()).jsonObject
            body["candidates"]?.jsonArray?.get(0)?.jsonObject?.get("content")?.jsonObject?.get("parts")?.jsonArray?.get(0)?.jsonObject?.get("text")?.jsonPrimitive?.content
        } catch (e: Exception) {
            null
        }
    }
}

