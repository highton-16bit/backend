package com.vibelog.plugins

import io.ktor.server.application.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import com.vibelog.models.*
import kotlinx.coroutines.Dispatchers

fun Application.configureDatabase() {
    val config = environment.config.config("storage")
    val driverClassName = config.property("driverClassName").getString()
    val jdbcURL = config.property("jdbcURL").getString()
    val user = config.property("user").getString()
    val password = config.property("password").getString()

    val hikariConfig = HikariConfig().apply {
        this.driverClassName = driverClassName
        this.jdbcUrl = jdbcURL
        this.username = user
        this.password = password
        maximumPoolSize = 5
        connectionTimeout = 30000 // 30초
        idleTimeout = 600000
        maxLifetime = 1800000
        isAutoCommit = false
        transactionIsolation = "TRANSACTION_READ_COMMITTED"
        
        // PostgreSQL 전용 최적화
        addDataSourceProperty("reWriteBatchedInserts", "true")
        validate()
    }

    val dataSource = HikariDataSource(hikariConfig)
    Database.connect(dataSource)

    transaction {
        // 신규 테이블(Likes, Bookmarks) 포함하여 생성
        SchemaUtils.create(Users, Travels, TravelPlanItems, TravelPhotos, Posts, PostLikes, Bookmarks, PostPhotoMappings)
    }
}

suspend fun <T> dbQuery(block: suspend () -> T): T =
    org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction(kotlinx.coroutines.Dispatchers.IO) { block() }
