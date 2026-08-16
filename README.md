# Knitted - Community Events & Craft Workshops

A premium full-stack web application designed for booking and managing community crafting workshops and events. Built with an **Angular 19** frontend, an **ASP.NET Core Web API (.NET 10)** backend, and backed by a **SQL Server** database running in Docker.

---

## 🏗️ Architecture Overview

- **Frontend**: Angular 19 client styled with pure custom CSS (no external CSS frameworks), featuring responsive state management, functional JWT interceptors, and lazy-loaded routing structures.
- **Backend**: ASP.NET Core Web API (.NET 10) incorporating Entity Framework Core (EF Core), Repository-style database modeling, atomic SQL transactions for concurrent ticket booking controls, and secure local JWT generation & validation.
- **Database**: Microsoft SQL Server 2022 containerized via Docker Compose.
- **Authentication**: Custom local Email/Password authentication & Google OAuth integrations.
- **Testing**:
  - Backend: NUnit unit tests combined with FluentAssertions and EF Core InMemory providers.
  - Frontend: Jasmine unit tests executed inside ChromeHeadless.
  - E2E: Playwright Test suites validating end-to-end user reservation paths.

---

## 🛠️ Installation & Setup

### Prerequisites
Make sure you have the following installed on your machine:
- [Docker & Docker Compose](https://www.docker.com/)
- [.NET 10 SDK](https://dotnet.microsoft.com/)
- [Node.js (v18+) & npm](https://nodejs.org/)

---

### Step 1: Database Setup (Docker)

1. Create a `.env` file in the root directory (this file is excluded from git control via `.gitignore`):
   ```env
   MSSQL_SA_PASSWORD=YourStrong@Password123
   ```
2. Start the SQL Server container in the background:
   ```bash
   docker-compose up -d
   ```

---

### Step 2: Backend Configuration & Run

1. Navigate to the backend API directory:
   ```bash
   cd backend/Knitted.Api
   ```
2. Set up local **.NET User Secrets** to store your connection string securely:
   ```bash
   dotnet user-secrets init
   dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost,1433;Database=KnittedDb;User Id=sa;Password=YourStrong@Password123;TrustServerCertificate=True"
   ```
3. Run Entity Framework migrations to establish the database schema:
   ```bash
   dotnet ef database update
   ```
4. Start the backend Web API server:
   ```bash
   dotnet run
   ```
   *The server runs locally on: `http://localhost:5013` (and `https://localhost:7251`)*

---

### Step 3: Frontend Configuration & Run

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. (Optional) Centralized API Config is located in `frontend/src/app/config/api.config.ts`. If your backend port differs, edit the base URL here:
   ```typescript
   export const API_BASE_URL = 'http://localhost:5013/api';
   ```
4. Start the Angular development server:
   ```bash
   npm start
   ```
   *Open browser to: `http://localhost:4200`*

---

## 🧪 Running Tests

### 1. Backend Unit Tests (NUnit)
Run the NUnit test suite (located under `backend/Knitted.Tests`) checking controller responses, logic validations, and InMemory database modifications:
```bash
dotnet test backend/Knitted.sln
```

### 2. Frontend Unit Tests (Karma/Jasmine)
Run the Angular components and services unit tests in headless mode (perfect for CI runs):
```bash
npm test --prefix frontend -- --watch=false --browsers=ChromeHeadless
```

### 3. End-to-End Tests (Playwright)
Run the Playwright E2E simulation validating register, login, catalog loading, and ticket booking operations:
```bash
# Install Playwright browsers (first-time setup)
npx playwright install chromium --prefix e2e

# Execute E2E tests
npx playwright test --prefix e2e
```

---

## 🚀 CI/CD Pipeline

The project includes a pre-configured GitHub Actions workflow located in `.github/workflows/ci.yml`. On every push or pull request to `main` and `develop` branches, the pipeline automatically:
1. Sets up the Docker container running SQL Server.
2. Restores backend packages, builds, and executes NUnit tests.
3. Installs frontend dependencies, validates compiles, and runs headless Karma specs.
4. Audits codebase health and verifies integration stability.
