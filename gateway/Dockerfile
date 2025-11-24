FROM eclipse-temurin:25-jdk
WORKDIR /app
COPY target/gateway.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]