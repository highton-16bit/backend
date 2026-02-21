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
data class PlanItemCreateRequest(
    val date: String,
    val startTime: String?,
    val endTime: String?,
    val memo: String?,
    val orderIndex: Int = 0
)

fun Route.travelRoutes() {
    route("/travels") {
        
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
    }
}
