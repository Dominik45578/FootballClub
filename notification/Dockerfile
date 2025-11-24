FROM eclipse-temurin:25-jdk
WORKDIR /app
COPY target/notification.jar app.jar
EXPOSE 12003
ENTRYPOINT ["java", "-jar", "app.jar"]