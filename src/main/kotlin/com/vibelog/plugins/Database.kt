package com.vibelog.plugins

import io.ktor.server.application.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import com.vibelog.models.*

fun Application.configureDatabase() {
    val config = environment.config.config("storage")
    val driverClassName = config.property("driverClassName").getString()
    val jdbcURL = config.property("jdbcURL").getString()
    val user = config.property("user").getString()
    val password = config.property("password").getString()

    // Supabase (PostgreSQL) 전용 HikariCP 설정
    val hikariConfig = HikariConfig().apply {
        this.driverClassName = driverClassName
        this.jdbcUrl = jdbcURL
        this.username = user
        this.password = password
        maximumPoolSize = 5 // 해커톤 환경 최적화
        isAutoCommit = false
        transactionIsolation = "TRANSACTION_READ_COMMITTED" // PostgreSQL 표준
        validate()
    }

    val dataSource = HikariDataSource(hikariConfig)
    Database.connect(dataSource)

    // 테이블 자동 생성 (PostgreSQL 스키마 준수)
    transaction {
        SchemaUtils.create(Users, Travels, TravelPlanItems, TravelPhotos, Posts, PostPhotoMappings)
    }
}

suspend fun <T> dbQuery(block: suspend () -> T): T =
    org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction(kotlin.coroutines.Dispatchers.IO) { block() }
