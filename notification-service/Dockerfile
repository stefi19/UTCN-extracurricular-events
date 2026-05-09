FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY build/distributions/notification-service.tar .
RUN tar -xf notification-service.tar --strip-components=1
ENTRYPOINT ["bin/notification-service"]
