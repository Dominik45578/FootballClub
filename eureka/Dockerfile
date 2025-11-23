FROM eclipse-temurin:25-jdk
WORKDIR /app
COPY target/eureka.jar app.jar
EXPOSE 12000
ENTRYPOINT ["java", "-jar", "app.jar"]