# 1. 프론트엔드 빌드 스테이지
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

# Google Maps API Key (빌드 시 주입)
ARG VITE_GOOGLE_MAPS_KEY
ENV VITE_GOOGLE_MAPS_KEY=$VITE_GOOGLE_MAPS_KEY

COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2. 백엔드 빌드 스테이지
FROM gradle:8.10-jdk21 AS backend-build
WORKDIR /home/gradle/src

# 프론트엔드 빌드 결과 복사
COPY --from=frontend-build /app/frontend/dist /home/gradle/src/src/main/resources/static

# 백엔드 소스 복사 (프론트엔드 제외)
COPY --chown=gradle:gradle build.gradle.kts settings.gradle.kts ./
COPY --chown=gradle:gradle src ./src

# Gradle 빌드 (npm 태스크 스킵)
RUN gradle bootJar --no-daemon -x npmInstall -x npmBuild -x copyFrontend

# 3. 실행 스테이지
FROM eclipse-temurin:21-jre-jammy
EXPOSE 8080
RUN mkdir /app
COPY --from=backend-build /home/gradle/src/build/libs/*-SNAPSHOT.jar /app/plog-api.jar
ENTRYPOINT ["java", "-jar", "/app/plog-api.jar"]
