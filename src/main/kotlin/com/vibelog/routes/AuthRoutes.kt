package com.vibelog.routes

import com.vibelog.models.*
import com.vibelog.plugins.dbQuery
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.sql.*
import java.util.*

/**
 * Authorization 헤더에서 username을 추출하여 User ID를 반환
 */
suspend fun ApplicationCall.getUserId(): UUID? {
    val username = request.headers["Authorization"] ?: return null
    return dbQuery {
        Users.selectAll()
            .where { Users.username eq username }
            .map { it[Users.id] }
            .singleOrNull()
    }
}

fun Route.authRoutes() {
    route("/auth") {
        // 회원가입 & 로그인 통합
        post {
            val request = call.receive<AuthRequest>()

            if (request.username.isBlank()) {
                call.respond(HttpStatusCode.BadRequest, MessageResponse("Username is required"))
                return@post
            }

            dbQuery {
                val exists = Users.selectAll()
                    .where { Users.username eq request.username }
                    .singleOrNull()

                if (exists == null) {
                    Users.insert { it[username] = request.username }
                }
            }

            call.respond(HttpStatusCode.OK, MessageResponse("OK"))
        }
    }
}
