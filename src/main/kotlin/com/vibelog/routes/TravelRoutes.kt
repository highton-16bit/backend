package com.vibelog.routes

import com.vibelog.models.*
import com.vibelog.plugins.dbQuery
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import java.util.*

fun Route.travelRoutes() {
    route("/travels") {

        // 내 여행 목록
        get {
            val userId = call.getUserId()
                ?: return@get call.respond(HttpStatusCode.Unauthorized, MessageResponse("Unauthorized"))

            val travels = dbQuery {
                Travels.selectAll()
                    .where { Travels.userId eq userId }
                    .orderBy(Travels.createdAt to SortOrder.DESC)
                    .map { it.toTravelResponse() }
            }

            call.respond(travels)
        }

        // 현재 진행 중인 여행
        get("/active") {
            val userId = call.getUserId()
                ?: return@get call.respond(HttpStatusCode.Unauthorized, MessageResponse("Unauthorized"))

            val today = Clock.System.now()
                .toLocalDateTime(TimeZone.currentSystemDefault())
                .date

            val active = dbQuery {
                Travels.selectAll()
                    .where {
                        (Travels.userId eq userId) and
                        (Travels.startDate lessEq today) and
                        (Travels.endDate greaterEq today)
                    }
                    .orderBy(Travels.createdAt to SortOrder.DESC)
                    .limit(1)
                    .map { it.toTravelResponse() }
                    .singleOrNull()
            }

            if (active != null) {
                call.respond(active)
            } else {
                call.respond(HttpStatusCode.NoContent)
            }
        }

        // 여행 상세
        get("/{id}") {
            val travelId = call.parameters["id"]?.toUuidOrNull()
                ?: return@get call.respond(HttpStatusCode.BadRequest, MessageResponse("Invalid ID"))

            val travel = dbQuery {
                Travels.selectAll()
                    .where { Travels.id eq travelId }
                    .map { it.toTravelResponse() }
                    .singleOrNull()
            }

            if (travel != null) {
                call.respond(travel)
            } else {
                call.respond(HttpStatusCode.NotFound, MessageResponse("Travel not found"))
            }
        }

        // 여행 생성
        post {
            val userId = call.getUserId()
                ?: return@post call.respond(HttpStatusCode.Unauthorized, MessageResponse("Unauthorized"))

            val request = call.receive<TravelCreateRequest>()

            val newId = dbQuery {
                Travels.insert {
                    it[Travels.userId] = userId
                    it[title] = request.title
                    it[startDate] = LocalDate.parse(request.startDate)
                    it[endDate] = LocalDate.parse(request.endDate)
                    it[regionName] = request.regionName
                    it[isPublic] = request.isPublic
                } get Travels.id
            }

            call.respond(HttpStatusCode.Created, IdResponse(newId.toString()))
        }

        // 여행 삭제
        delete("/{id}") {
            val travelId = call.parameters["id"]?.toUuidOrNull()
                ?: return@delete call.respond(HttpStatusCode.BadRequest, MessageResponse("Invalid ID"))

            dbQuery {
                Travels.deleteWhere { Travels.id eq travelId }
            }

            call.respond(HttpStatusCode.OK, MessageResponse("Deleted"))
        }

        // 일정 목록
        get("/{id}/plans") {
            val travelId = call.parameters["id"]?.toUuidOrNull()
                ?: return@get call.respond(HttpStatusCode.BadRequest, MessageResponse("Invalid ID"))

            val plans = dbQuery {
                TravelPlanItems.selectAll()
                    .where { TravelPlanItems.travelId eq travelId }
                    .orderBy(TravelPlanItems.date to SortOrder.ASC)
                    .orderBy(TravelPlanItems.startTime to SortOrder.ASC)
                    .map { it.toPlanResponse() }
            }

            call.respond(plans)
        }

        // 일정 추가
        post("/{id}/plans") {
            val travelId = call.parameters["id"]?.toUuidOrNull()
                ?: return@post call.respond(HttpStatusCode.BadRequest, MessageResponse("Invalid ID"))

            val request = call.receive<PlanCreateRequest>()

            // 시간 검증
            if (request.startTime != null && request.endTime != null) {
                if (request.startTime > request.endTime) {
                    return@post call.respond(
                        HttpStatusCode.BadRequest,
                        MessageResponse("Start time must be earlier than end time")
                    )
                }
            }

            val newId = dbQuery {
                TravelPlanItems.insert {
                    it[TravelPlanItems.travelId] = travelId
                    it[date] = LocalDate.parse(request.date)
                    it[startTime] = request.startTime
                    it[endTime] = request.endTime
                    it[memo] = request.memo
                    it[orderIndex] = request.orderIndex
                } get TravelPlanItems.id
            }

            call.respond(HttpStatusCode.Created, IdResponse(newId.toString()))
        }

        // 일정 수정
        patch("/{id}/plans/{planId}") {
            val planId = call.parameters["planId"]?.toUuidOrNull()
                ?: return@patch call.respond(HttpStatusCode.BadRequest, MessageResponse("Invalid Plan ID"))

            val request = call.receive<PlanCreateRequest>()

            // 시간 검증
            if (request.startTime != null && request.endTime != null) {
                if (request.startTime > request.endTime) {
                    return@patch call.respond(
                        HttpStatusCode.BadRequest,
                        MessageResponse("Start time must be earlier than end time")
                    )
                }
            }

            dbQuery {
                TravelPlanItems.update({ TravelPlanItems.id eq planId }) {
                    it[date] = LocalDate.parse(request.date)
                    it[startTime] = request.startTime
                    it[endTime] = request.endTime
                    it[memo] = request.memo
                    it[orderIndex] = request.orderIndex
                }
            }

            call.respond(HttpStatusCode.OK, MessageResponse("Updated"))
        }

        // 일정 삭제
        delete("/{id}/plans/{planId}") {
            val planId = call.parameters["planId"]?.toUuidOrNull()
                ?: return@delete call.respond(HttpStatusCode.BadRequest, MessageResponse("Invalid Plan ID"))

            dbQuery {
                TravelPlanItems.deleteWhere { TravelPlanItems.id eq planId }
            }

            call.respond(HttpStatusCode.OK, MessageResponse("Deleted"))
        }
    }
}

// Extension functions
private fun ResultRow.toTravelResponse() = TravelResponse(
    id = this[Travels.id].toString(),
    title = this[Travels.title],
    startDate = this[Travels.startDate].toString(),
    endDate = this[Travels.endDate].toString(),
    regionName = this[Travels.regionName],
    isPublic = this[Travels.isPublic]
)

private fun ResultRow.toPlanResponse() = PlanResponse(
    id = this[TravelPlanItems.id].toString(),
    date = this[TravelPlanItems.date].toString(),
    startTime = this[TravelPlanItems.startTime],
    endTime = this[TravelPlanItems.endTime],
    memo = this[TravelPlanItems.memo]
)

private fun String.toUuidOrNull(): UUID? = try {
    UUID.fromString(this)
} catch (e: Exception) {
    null
}
