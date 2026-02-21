package com.vibelog.plugins

import io.ktor.server.application.*
import io.ktor.server.plugins.swagger.*
import io.ktor.server.routing.*

fun Application.configureSwagger() {
    routing {
        // http://localhost:8080/docs 에 접속하면 Swagger UI 확인 가능
        swaggerUI(path = "docs", swaggerFile = "openapi/documentation.yaml")
    }
}
