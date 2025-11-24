FROM eclipse-temurin:25-jdk
WORKDIR /app
COPY target/eureka.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]