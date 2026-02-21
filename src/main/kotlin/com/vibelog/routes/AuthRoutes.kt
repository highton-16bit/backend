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

// 헤더에서 유저를 찾아주는 공통 확장 함수
suspend fun ApplicationCall.getUserIdFromHeader(): UUID? {
    val username = request.headers["Authorization"] ?: return null
    return dbQuery {
        Users.selectAll().where { Users.username eq username }
            .map { it[Users.id] }
            .singleOrNull()
    }
}

fun Route.authRoutes() {
    route("/auth") {
        // 회원가입 & 로그인 통합 (발표용: One-Stop Auth)
        post {
            val request = call.receive<AuthRequest>()
            
            dbQuery {
                val existingUser = Users.selectAll().where { Users.username eq request.username }.singleOrNull()
                if (existingUser == null) {
                    Users.insert {
                        it[username] = request.username
                    }
                }
            }
            call.respond(HttpStatusCode.OK)
        }
    }
}
