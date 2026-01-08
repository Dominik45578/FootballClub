FROM eclipse-temurin:25-jdk
WORKDIR /app
COPY target/football-external-data-service.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]