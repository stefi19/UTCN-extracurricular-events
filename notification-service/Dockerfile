FROM gradle:8-jdk17 AS build
WORKDIR /app
COPY build.gradle.kts settings.gradle.kts ./
COPY src ./src
RUN gradle build --no-daemon -x test

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/build/distributions/*.tar .
RUN tar -xf *.tar --strip-components=1 && rm *.tar
EXPOSE 8081
ENTRYPOINT ["bin/notification-service"]
