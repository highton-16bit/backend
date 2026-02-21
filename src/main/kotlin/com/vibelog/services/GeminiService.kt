package com.vibelog.services

import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.*

class GeminiService(private val apiKey: String) {
    private val client = HttpClient {
        install(ContentNegotiation) {
            json()
        }
    }

    suspend fun generateText(prompt: String): String {
        if (apiKey.isEmpty()) return "AI API Key is missing"
        
        return try {
            val response = client.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$apiKey") {
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
            body["candidates"]?.jsonArray?.get(0)?.jsonObject?.get("content")?.jsonObject?.get("parts")?.jsonArray?.get(0)?.jsonObject?.get("text")?.jsonPrimitive?.content ?: "AI 답변 생성 실패"
        } catch (e: Exception) {
            "AI 호출 중 오류 발생: ${e.message}"
        }
    }

    suspend fun parseItinerary(summary: String): JsonObject? {
        val prompt = """
            다음 여행 요약글을 분석해서 일별 계획들을 추출해줘.
            응답은 반드시 'planItems' 라는 키를 가진 JSON 객체여야 하며, 리스트 내 각 객체는 다음 필드를 가져야 해:
            - date: 'YYYY-MM-DD' 형식 (없으면 오늘 날짜 기준)
            - startTime: 'HH:mm' 형식 또는 null
            - endTime: 'HH:mm' 형식 또는 null
            - memo: 일정의 핵심 내용 (장소나 활동 포함)

            요약글:
            $summary
            
            반드시 순수 JSON 형식으로만 답변해줘. (Markdown 코드 블록 제외)
        """.trimIndent()

        val text = generateText(prompt)
        return try {
            val jsonStart = text.indexOf("{")
            val jsonEnd = text.lastIndexOf("}") + 1
            if (jsonStart != -1 && jsonEnd != -1) {
                Json.parseToJsonElement(text.substring(jsonStart, jsonEnd)).jsonObject
            } else null
        } catch (e: Exception) {
            null
        }
    }
}
