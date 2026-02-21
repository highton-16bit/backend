plugins {
    kotlin("jvm") version "2.1.0"
    kotlin("plugin.spring") version "2.1.0"
    kotlin("plugin.jpa") version "2.1.0"
    id("org.springframework.boot") version "3.4.1"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.plog"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // Spring Boot
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // Kotlin
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")

    // Database
    runtimeOnly("org.postgresql:postgresql")

    // Swagger / OpenAPI
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.7.0")

    // AWS S3 SDK for Supabase
    implementation("software.amazon.awssdk:s3:2.20.162")

    // EXIF Metadata Extractor
    implementation("com.drewnoakes:metadata-extractor:2.19.0")

    // WebClient for Gemini API
    implementation("org.springframework.boot:spring-boot-starter-webflux")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

allOpen {
    annotation("jakarta.persistence.Entity")
    annotation("jakarta.persistence.MappedSuperclass")
    annotation("jakarta.persistence.Embeddable")
}

tasks.withType<Test> {
    useJUnitPlatform()
}

// Frontend Build Tasks
val frontendDir = file("frontend")
val frontendBuildDir = file("frontend/dist")
val staticDir = file("src/main/resources/static")

tasks.register<Exec>("npmInstall") {
    workingDir = frontendDir
    commandLine = listOf("npm", "install")
}

tasks.register<Exec>("npmBuild") {
    dependsOn("npmInstall")
    workingDir = frontendDir
    commandLine = listOf("npm", "run", "build")
}

tasks.register<Copy>("copyFrontend") {
    dependsOn("npmBuild")
    from(frontendBuildDir)
    into(staticDir)
}

tasks.named("processResources") {
    dependsOn("copyFrontend")
}

// 클린 시 static 폴더도 삭제
tasks.named<Delete>("clean") {
    delete(staticDir)
}
