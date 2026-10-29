# Knitted - Community Events & Craft Workshops

Knitted is a community events app with an Angular 19 frontend, a NestJS API, and Cloud Firestore. Both are hosted on Vercel: the frontend at https://knitted-web.vercel.app and the API at https://knitted-api.vercel.app.

## Architecture

- **Frontend:** Angular 19, hosted on Vercel.
- **Backend:** NestJS with JWT email/password authentication, Google OAuth, user profiles, events, bookings, search/filtering, and event chat.
- **Database:** Cloud Firestore, accessed through the Firebase Admin SDK. Collections are created on first write; numeric IDs come from documents in the `counters` collection.
- **External events:** Optional Meetup event import through Apify.

The active API, build, and deployment configuration are under `backend/src`.

## Run locally

### 1. Set up Firestore

The project is `knitted-events-2610` (see `.firebaserc`). The deny-all security rules (`firestore.rules`) and the composite indexes the API needs (`firestore.indexes.json`) are deployed with:

```bash
firebase deploy --only firestore
```

Sign in with Application Default Credentials so the API can reach the database:

```bash
gcloud auth application-default login
```

To work offline instead, run the Firestore emulator (`firebase emulators:start --only firestore`) and set `FIRESTORE_EMULATOR_HOST` to its address before starting the API. The emulator defaults to port 8080, as does the API, so set `PORT` to something else for one of them.

### 2. Start the API

Use Node.js 22 or newer. From the repository root:

```powershell
cd backend
npm install
$env:FIREBASE_PROJECT_ID = "<firebase-project-id>"
$env:JWT_SECRET = "replace-this-with-a-random-secret-of-at-least-32-characters"
npm run start:dev
```

The API is available at `http://localhost:8080/api`; the health endpoint is `http://localhost:8080/api/health`.

Google login additionally requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and either `PUBLIC_API_URL` or `GOOGLE_CALLBACK_URL`. Register the resulting `/api/auth/google-callback` URL in Google Cloud Console. Set `APIFY_API_TOKEN` only if the external event scanner is needed.

## Deploy to Vercel

Two Vercel projects (team `mikekane007s-projects`) are connected to this repository and deploy automatically: pushes to `main` go to production, and every pull request gets a preview deployment.

| Project | Root directory | Production URL |
|---|---|---|
| `knitted-api` | `backend` (NestJS preset) | https://knitted-api.vercel.app |
| `knitted-web` | `frontend` (Angular, see `frontend/vercel.json`) | https://knitted-web.vercel.app |

`knitted-api` environment variables:

- `FIREBASE_PROJECT_ID`, and `FIREBASE_SERVICE_ACCOUNT` holding the service account key JSON (Vercel has no Application Default Credentials).
- `JWT_SECRET` (32+ characters) and `NODE_ENV=production`.
- `PUBLIC_API_URL`, `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` set to the URLs above.
- Optional: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (register `https://knitted-api.vercel.app/api/auth/google-callback` as a redirect URI), and `APIFY_API_TOKEN`.

The API can also run on Google Cloud Run with `backend/deploy-cloudrun.ps1` and `backend/cloudrun.env.example.yaml`.

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
