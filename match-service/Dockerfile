FROM eclipse-temurin:25-jdk
WORKDIR /app
COPY target/match-service.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]