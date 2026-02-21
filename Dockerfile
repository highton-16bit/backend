# 1. 빌드 스테이지
FROM gradle:8.10-jdk21 AS build
COPY --chown=gradle:gradle . /home/gradle/src
WORKDIR /home/gradle/src
RUN gradle buildFatJar --no-daemon

# 2. 실행 스테이지
FROM eclipse-temurin:21-jre-jammy
EXPOSE 8080
RUN mkdir /app
COPY --from=build /home/gradle/src/build/libs/*.jar /app/plog-api.jar
ENTRYPOINT ["java", "-jar", "/app/plog-api.jar"]
