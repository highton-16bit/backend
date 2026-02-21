package com.vibelog.plugins

import io.ktor.server.application.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import com.vibelog.models.*

fun Application.configureDatabase() {
    // 해커톤용: MySQL 로컬 연결 (발표: Scalable RDBMS Cluster)
    val hikariConfig = HikariConfig().apply {
        this.driverClassName = "com.mysql.cj.jdbc.Driver"
        this.jdbcUrl = "jdbc:mysql://localhost:3306/vibelog?serverTimezone=UTC&useSSL=false"
        this.username = "root"
        this.password = "" // 로컬 비밀번호 입력
        maximumPoolSize = 10
        isAutoCommit = false
        transactionIsolation = "TRANSACTION_REPEATABLE_READ"
        validate()
    }

    val dataSource = HikariDataSource(hikariConfig)
    Database.connect(dataSource)

    transaction {
        SchemaUtils.create(Travels, TravelPlanItems, Posts, PostPhotoMappings)
    }
}

suspend fun <T> dbQuery(block: suspend () -> T): T =
    org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction(kotlin.coroutines.Dispatchers.IO) { block() }
