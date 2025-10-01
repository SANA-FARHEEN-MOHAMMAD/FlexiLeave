# Use an official JDK image as base
FROM openjdk:17-jdk-slim

# Set working directory
WORKDIR /app

# Copy the project files
COPY . .

# Build the application
RUN ./mvnw clean package -DskipTests

# Expose port 8080 (Spring Boot default)
EXPOSE 8080

# Run the JAR file
CMD ["java", "-jar", "target/leave-management-0.0.1-SNAPSHOT.jar"]
