package com.plog.service

import com.plog.dto.*
import com.plog.entity.Post
import com.plog.entity.Travel
import com.plog.entity.TravelPlanItem
import com.plog.entity.User
import com.plog.repository.PostRepository
import com.plog.repository.TravelPlanItemRepository
import com.plog.repository.TravelRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.*

@Service
@Transactional(readOnly = true)
class SearchService(
    private val postRepository: PostRepository,
    private val travelRepository: TravelRepository,
    private val planItemRepository: TravelPlanItemRepository,
    private val geminiService: GeminiService
) {
    fun searchByRegion(query: String): RegionSearchResponse {
        val posts = postRepository.searchByRegionOrContent(query)
            .take(20)
            .map { it.toSearchItem() }

        val mapPins = posts
            .filter { it.latitude != null && it.longitude != null }
            .map { post ->
                MapPin(
                    postId = post.id,
                    title = post.title,
                    latitude = post.latitude!!,
                    longitude = post.longitude!!,
                    photoUrl = post.photoUrl
                )
            }

        val matchedRegion = posts
            .mapNotNull { it.regionName }
            .groupingBy { it }
            .eachCount()
            .maxByOrNull { it.value }
            ?.key

        return RegionSearchResponse(
            query = query,
            regionName = matchedRegion,
            posts = posts,
            mapPins = mapPins
        )
    }

    fun searchWithAI(query: String): AISearchResponse {
        val relatedPosts = postRepository.searchByRegionOrContent(query)
            .take(5)
            .map { it.toSearchItem() }

        val context = if (relatedPosts.isNotEmpty()) {
            "우리 앱 유저들의 관련 여행 기록이야: ${relatedPosts.map { "${it.regionName ?: ""} ${it.title}: ${it.summary}" }}"
        } else ""

        val prompt = """
            $context

            사용자의 질문: '$query'
            위의 유저 기록들과 너의 지식을 합쳐서 최고의 답변을 줘. 추천 장소와 간단한 이유를 포함해줘.
        """.trimIndent()

        val answer = try {
            geminiService.generateText(prompt)
        } catch (e: Exception) {
            "AI 응답을 생성할 수 없습니다."
        }

        return AISearchResponse(query = query, answer = answer, relatedPosts = relatedPosts)
    }

    fun findByRegion(regionName: String): RegionSearchResponse {
        val posts = postRepository.findByRegionOrderByLikeCountDesc(regionName)
            .take(50)
            .map { it.toSearchItem() }

        val mapPins = posts
            .filter { it.latitude != null && it.longitude != null }
            .map { post ->
                MapPin(
                    postId = post.id,
                    title = post.title,
                    latitude = post.latitude!!,
                    longitude = post.longitude!!,
                    photoUrl = post.photoUrl
                )
            }

        return RegionSearchResponse(
            query = regionName,
            regionName = regionName,
            posts = posts,
            mapPins = mapPins
        )
    }

    @Transactional
    fun clonePost(user: User, postId: UUID): CloneResponse {
        val post = postRepository.findById(postId)
            .orElseThrow { IllegalArgumentException("Post not found") }

        val summary = post.contentSummary
            ?: throw IllegalArgumentException("Post has no content to clone")

        val parsedJson = geminiService.parseItinerary(summary)
            ?: throw RuntimeException("Failed to parse itinerary")

        val originalTravel = post.travel

        // 새 여행 생성
        val newTravel = Travel(
            user = user,
            title = "${originalTravel.title} (클론)",
            startDate = originalTravel.startDate,
            endDate = originalTravel.endDate,
            regionName = originalTravel.regionName,
            isPublic = false
        )
        travelRepository.save(newTravel)

        // 파싱된 일정 저장
        val planItems = mutableListOf<PlanResponse>()

        parsedJson.planItems.forEachIndexed { index, item ->
            val date = try {
                LocalDate.parse(item.date)
            } catch (e: Exception) {
                LocalDate.now()
            }

            val planItem = TravelPlanItem(
                travel = newTravel,
                date = date,
                startTime = item.startTime,
                endTime = item.endTime,
                memo = item.memo,
                orderIndex = index
            )
            planItemRepository.save(planItem)

            planItems.add(
                PlanResponse(
                    id = planItem.id.toString(),
                    date = date.toString(),
                    startTime = item.startTime,
                    endTime = item.endTime,
                    memo = item.memo
                )
            )
        }

        // 클론 횟수 증가
        post.cloneCount += 1

        return CloneResponse(
            travelId = newTravel.id.toString(),
            planItems = planItems
        )
    }

    private fun Post.toSearchItem(): SearchPostItem {
        val firstPhoto = photos.firstOrNull()
        val photosWithCoords = photos.filter { it.latitude != null && it.longitude != null }
        val avgLat = photosWithCoords.mapNotNull { it.latitude }.takeIf { it.isNotEmpty() }?.average()
        val avgLng = photosWithCoords.mapNotNull { it.longitude }.takeIf { it.isNotEmpty() }?.average()

        return SearchPostItem(
            id = id.toString(),
            title = title,
            summary = contentSummary,
            regionName = travel.regionName,
            latitude = avgLat,
            longitude = avgLng,
            likeCount = likeCount,
            photoUrl = firstPhoto?.imageUrl
        )
    }
}
