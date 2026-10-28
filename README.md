# Knitted - Community Events & Craft Workshops

Knitted is a community events app with an Angular 19 frontend, a NestJS API, and PostgreSQL. The frontend is hosted on GitHub Pages; the API can be deployed independently to Google Cloud Run.

## Architecture

- **Frontend:** Angular 19, currently hosted on GitHub Pages.
- **Backend:** NestJS with JWT email/password authentication, Google OAuth, user profiles, events, bookings, search/filtering, and event chat.
- **Database:** PostgreSQL. The NestJS API creates missing tables compatible with the existing PostgreSQL schema when it starts.
- **External events:** Optional Meetup event import through Apify.

The active API, build, and deployment configuration are under `backend/src`.

## Run locally

### 1. Start PostgreSQL

Requires Docker and Docker Compose. Optionally set `POSTGRES_PASSWORD` in the root `.env` file, then run:

```bash
docker compose up -d
```

### 2. Start the API

Use Node.js 22 or newer. From the repository root:

```powershell
cd backend
npm install
$env:DATABASE_URL = "postgresql://knitted:local-knitted-password@localhost:5432/knitted"
$env:JWT_SECRET = "replace-this-with-a-random-secret-of-at-least-32-characters"
$env:PGSSL = "disable"
npm run start:dev
```

The API is available at `http://localhost:8080/api`; the health endpoint is `http://localhost:8080/api/health`.

Google login additionally requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and either `PUBLIC_API_URL` or `GOOGLE_CALLBACK_URL`. Register the resulting `/api/auth/google-callback` URL in Google Cloud Console. Set `APIFY_API_TOKEN` only if the external event scanner is needed.

## Deploy the API to Cloud Run

The frontend remains on GitHub Pages; Firebase Hosting is not needed. Cloud Run offers monthly free-tier usage, but requires a Google Cloud billing account and charges for usage above the free allowance.

1. Copy `backend/cloudrun.env.example.yaml` to `backend/cloudrun.env.yaml`.
2. Fill in the PostgreSQL `DATABASE_URL`, a strong `JWT_SECRET`, and any optional Google/Apify credentials. Set `PUBLIC_API_URL` to the final Cloud Run URL; use the matching callback URL in Google Cloud Console.
3. From PowerShell:

   ```powershell
   cd backend
   .\deploy-cloudrun.ps1 -Project <gcp-project-id>
   ```

4. Set `API_BASE_URL` in `frontend/src/app/config/api.config.ts` to `https://<cloud-run-service-url>/api`, then rebuild and redeploy the frontend to GitHub Pages.

The deployment script scales to zero when idle and caps the service at two instances. Configure a billing budget alert in Google Cloud; free-tier allowances are not a hard spending cap.

## Tests and builds

```bash
cd backend
npm ci
npm run build
npm test
cd ../frontend
npm ci
npm run build -- --configuration=production
```

The end-to-end Playwright tests live in `e2e`.
