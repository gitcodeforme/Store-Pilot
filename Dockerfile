# Step 1: Build the application
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY store-management/pom.xml .
COPY store-management/src ./src
RUN mvn clean package -DskipTests

# Step 2: Run the application
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
