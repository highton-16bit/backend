package com.vibelog.routes

import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import com.vibelog.models.*
import com.vibelog.plugins.dbQuery
import org.jetbrains.exposed.sql.*
import java.util.*
import kotlinx.datetime.LocalDate
import kotlinx.serialization.Serializable

@Serializable
data class TravelCreateRequest(
    val title: String,
    val startDate: String,
    val endDate: String,
    val regionName: String?,
    val isPublic: Boolean = false
)

@Serializable
data class PlanItemCreateRequest(
    val date: String,
    val startTime: String?,
    val endTime: String?,
    val memo: String?,
    val orderIndex: Int = 0
)

fun Route.travelRoutes() {
    route("/travels") {
        
        // 여행 목록 조회
        get {
            val userId = call.getUserIdFromHeader() ?: return@get call.respond(HttpStatusCode.Unauthorized, "Invalid User")
            val travels = dbQuery {
                Travels.selectAll().where { Travels.userId eq userId }
                    .orderBy(Travels.createdAt to SortOrder.DESC)
                    .map { row ->
                        TravelDTO(
                            id = row[Travels.id].toString(),
                            title = row[Travels.title],
                            startDate = row[Travels.startDate].toString(),
                            endDate = row[Travels.endDate].toString(),
                            regionName = row[Travels.regionName],
                            isPublic = row[Travels.isPublic]
                        )
                    }
            }
            call.respond(travels)
        }

        // 활성 여행 조회 (현재 날짜 기준 진행 중인 여행)
        get("/active") {
            val userId = call.getUserIdFromHeader() ?: return@get call.respond(HttpStatusCode.Unauthorized, "Invalid User")
            val today = kotlinx.datetime.Clock.System.now().toLocalDateTime(kotlinx.datetime.TimeZone.currentSystemDefault()).date
            val activeTravel = dbQuery {
                Travels.selectAll().where {
                    (Travels.userId eq userId) and
                    (Travels.startDate lessEq today) and
                    (Travels.endDate greaterEq today)
                }
                    .orderBy(Travels.createdAt to SortOrder.DESC)
                    .limit(1)
                    .map { row ->
                        TravelDTO(
                            id = row[Travels.id].toString(),
                            title = row[Travels.title],
                            startDate = row[Travels.startDate].toString(),
                            endDate = row[Travels.endDate].toString(),
                            regionName = row[Travels.regionName],
                            isPublic = row[Travels.isPublic]
                        )
                    }
                    .singleOrNull()
            }
            if (activeTravel != null) {
                call.respond(activeTravel)
            } else {
                call.respond(HttpStatusCode.NoContent)
            }
        }

        // 여행 상세 조회
        get("/{id}") {
            val travelId = UUID.fromString(call.parameters["id"])
            val travel = dbQuery {
                Travels.selectAll().where { Travels.id eq travelId }
                    .map { row ->
                        TravelDTO(
                            id = row[Travels.id].toString(),
                            title = row[Travels.title],
                            startDate = row[Travels.startDate].toString(),
                            endDate = row[Travels.endDate].toString(),
                            regionName = row[Travels.regionName],
                            isPublic = row[Travels.isPublic]
                        )
                    }
                    .singleOrNull()
            }
            if (travel != null) {
                call.respond(travel)
            } else {
                call.respond(HttpStatusCode.NotFound, "Travel not found")
            }
        }

        // 여행 삭제
        delete("/{id}") {
            val travelId = UUID.fromString(call.parameters["id"])
            dbQuery {
                Travels.deleteWhere { Travels.id eq travelId }
            }
            call.respond(HttpStatusCode.OK)
        }

        // 여행 생성
        post {
            val userId = call.getUserIdFromHeader() ?: return@post call.respond(HttpStatusCode.Unauthorized, "Invalid User")
            val request = call.receive<TravelCreateRequest>()
            
            val newTravelId = dbQuery {
                Travels.insert {
                    it[Travels.userId] = userId
                    it[Travels.title] = request.title
                    it[Travels.startDate] = LocalDate.parse(request.startDate)
                    it[Travels.endDate] = LocalDate.parse(request.endDate)
                    it[Travels.regionName] = request.regionName
                    it[Travels.isPublic] = request.isPublic
                } get Travels.id
            }
            call.respond(HttpStatusCode.Created, mapOf("id" to newTravelId.toString()))
        }

        get("/{id}/plans") {
            val travelId = UUID.fromString(call.parameters["id"])
            val plans = dbQuery {
                TravelPlanItems.selectAll().where { TravelPlanItems.travelId eq travelId }
                    .orderBy(TravelPlanItems.date to SortOrder.ASC)
                    .orderBy(TravelPlanItems.startTime to SortOrder.ASC)
                    .map { row ->
                        PlanItemDTO(
                            id = row[TravelPlanItems.id].toString(),
                            date = row[TravelPlanItems.date].toString(),
                            startTime = row[TravelPlanItems.startTime],
                            endTime = row[TravelPlanItems.endTime],
                            memo = row[TravelPlanItems.memo]
                        )
                    }
            }
            call.respond(plans)
        }

        post("/{id}/plans") {
            val travelId = UUID.fromString(call.parameters["id"])
            val request = call.receive<PlanItemCreateRequest>()
            
            // 시간 검증: 시작 시간이 종료 시간보다 늦으면 에러 (예: 03:00 ~ 02:00 차단)
            if (request.startTime != null && request.endTime != null) {
                if (request.startTime > request.endTime) {
                    return@post call.respond(HttpStatusCode.BadRequest, "Start time must be earlier than end time")
                }
            }

            val newPlanId = dbQuery {
                TravelPlanItems.insert {
                    it[TravelPlanItems.travelId] = travelId
                    it[TravelPlanItems.date] = LocalDate.parse(request.date)
                    it[TravelPlanItems.startTime] = request.startTime
                    it[TravelPlanItems.endTime] = request.endTime
                    it[TravelPlanItems.memo] = request.memo
                    it[TravelPlanItems.orderIndex] = request.orderIndex
                } get TravelPlanItems.id
            }
            call.respond(HttpStatusCode.Created, mapOf("id" to newPlanId.toString()))
        }

        patch("/{id}/plans/{planId}") {
            val planId = UUID.fromString(call.parameters["planId"])
            val request = call.receive<PlanItemCreateRequest>()

            if (request.startTime != null && request.endTime != null) {
                if (request.startTime > request.endTime) {
                    return@patch call.respond(HttpStatusCode.BadRequest, "Start time must be earlier than end time")
                }
            }

            dbQuery {
                TravelPlanItems.update({ TravelPlanItems.id eq planId }) {
                    it[TravelPlanItems.date] = LocalDate.parse(request.date)
                    it[TravelPlanItems.startTime] = request.startTime
                    it[TravelPlanItems.endTime] = request.endTime
                    it[TravelPlanItems.memo] = request.memo
                    it[TravelPlanItems.orderIndex] = request.orderIndex
                }
            }
            call.respond(HttpStatusCode.OK)
        }

        delete("/{id}/plans/{planId}") {
            val planId = UUID.fromString(call.parameters["planId"])
            dbQuery {
                TravelPlanItems.deleteWhere { TravelPlanItems.id eq planId }
            }
            call.respond(HttpStatusCode.OK)
        }
    }
}
