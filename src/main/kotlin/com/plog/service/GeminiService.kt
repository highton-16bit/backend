package com.plog.service

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient

@Service
class GeminiService(
    @Value("\${gemini.api-key:}") private val apiKey: String,
    private val objectMapper: ObjectMapper
) {
    private val webClient = WebClient.builder()
        .baseUrl("https://generativelanguage.googleapis.com")
        .build()

    fun generateText(prompt: String): String {
        if (apiKey.isEmpty()) return "AI API Key is missing"

        return try {
            val request = GeminiRequest(
                contents = listOf(
                    Content(parts = listOf(Part(text = prompt)))
                )
            )

            val response = webClient.post()
                .uri("/v1beta/models/gemini-2.0-flash:generateContent?key=$apiKey")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(GeminiResponse::class.java)
                .block()

            response?.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                ?: "AI 답변 생성 실패"
        } catch (e: Exception) {
            "AI 호출 중 오류 발생: ${e.message}"
        }
    }

    fun parseItinerary(summary: String): ParsedItinerary? {
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
            if (jsonStart != -1 && jsonEnd > jsonStart) {
                objectMapper.readValue(text.substring(jsonStart, jsonEnd), ParsedItinerary::class.java)
            } else null
        } catch (e: Exception) {
            null
        }
    }
}

// Gemini API Request/Response DTOs
data class GeminiRequest(val contents: List<Content>)
data class Content(val parts: List<Part>)
data class Part(val text: String)

@JsonIgnoreProperties(ignoreUnknown = true)
data class GeminiResponse(val candidates: List<Candidate>?)

@JsonIgnoreProperties(ignoreUnknown = true)
data class Candidate(val content: CandidateContent?)

@JsonIgnoreProperties(ignoreUnknown = true)
data class CandidateContent(val parts: List<Part>?)

// Parsed Itinerary
@JsonIgnoreProperties(ignoreUnknown = true)
data class ParsedItinerary(val planItems: List<ParsedPlanItem> = emptyList())

@JsonIgnoreProperties(ignoreUnknown = true)
data class ParsedPlanItem(
    val date: String? = null,
    val startTime: String? = null,
    val endTime: String? = null,
    val memo: String? = null
)
