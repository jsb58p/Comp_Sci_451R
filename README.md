# Comp_Sci_451R

Full-stack application with React frontend and Spring Boot backend.

## Project Structure

```
Comp_Sci_451R/
├── client/          # React + TypeScript + Vite frontend
└── server/          # Spring Boot + Maven backend
```

## Prerequisites

- **Frontend**: Node.js 18+ and npm
- **Backend**: Java 17+ and Maven 3.6+

## Getting Started

### Backend (Spring Boot)

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```

   Or build and run the JAR:
   ```bash
   mvn clean package
   java -jar target/server-0.0.1-SNAPSHOT.jar
   ```

The backend server will start on `http://localhost:8080`

**Available endpoints:**
- `GET /api/hello?name=YourName` - Returns a greeting message
- `GET /api/status` - Returns server status
- `GET /h2-console` - H2 database console (for development)

### Frontend (React)

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will start on `http://localhost:5173`

## Development

- **Frontend dev server**: `http://localhost:5173`
- **Backend API**: `http://localhost:8080`
- API requests from the frontend to `/api/*` are automatically proxied to the backend

## Tech Stack

### Frontend
- React 19.1.1
- TypeScript 5.9.2
- Vite 7.1.4
- TailwindCSS 4.1.13
- StyleX 0.15.3
- Cypress 15.1.0 (testing)

### Backend
- Spring Boot 3.4.2
- Java 17
- Maven
- H2 Database (in-memory)
- Spring Data JPA

## Running Tests

### Frontend
```bash
cd client
npm run cy:open     # Opens Cypress test runner
```

### Backend
```bash
cd server
mvn test
```
