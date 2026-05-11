# Backend Dockerfile
FROM gradle:8-jdk21 AS build
WORKDIR /app
COPY build.gradle.kts settings.gradle.kts ./
COPY gradle ./gradle
COPY gradlew gradlew.bat ./
COPY src ./src
RUN gradle build --no-daemon -x test

FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache wget
WORKDIR /app
COPY --from=build /app/build/distributions/*.tar .
RUN tar -xf *.tar --strip-components=1 && rm *.tar
EXPOSE 8080
ENTRYPOINT ["bin/utcn-events-api"]
