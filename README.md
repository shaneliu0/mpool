# MPool

MPool is a mobile app that helps university students share rides to the airport. Students say when and where they're flying, MPool groups them with classmates on similar schedules, and the group splits the cost of the ride.

## Features

- **University-only access:** students sign in with a school Google account, or with Apple on iOS, and email domains decide who can join.
- **Travel seasons:** pool requests are organized around breaks, such as "Summer to DTW".
- **Automatic matching:** a backend job runs every 5 minutes and suggests pools based on flight time and location.
- **Group chat:** each pool gets a real-time chat.
- **Profiles:** students share interests and answer prompts so they know who they're riding with.
- **Notifications:** push notifications announce new matches and messages.
- **Safety tools:** users can block and report other users, and can delete their accounts.

## Tech stack

| Area | Tools |
|---|---|
| Mobile app (`frontend/`) | React Native, Expo SDK 47, TypeScript, Redux Toolkit, React Navigation |
| API (`backend/`) | Node.js, Express, TypeScript, Prisma |
| Database | PostgreSQL with PostGIS |
| Auth and chat | Firebase Authentication, Firebase Realtime Database |
| Cloud function (`backend/functions/`) | Firebase Functions, which sync new users to the API |
| Other services | Google Maps Platform, Expo push notifications |

## Setup

This project was last updated in 2024, so its dependencies are dated and may need upgrading. You'll need your own Firebase project, Google API keys and PostgreSQL database with PostGIS enabled. Any value in this repo that starts with `YOUR_` or `your-` is a placeholder.

### 1. Add your configuration

| File | What to set |
|---|---|
| `backend/src/serviceAccountKey.json` | Your Firebase service account key. This file is ignored by git, so never commit it. |
| `backend/src/index.ts` | Your Realtime Database URL |
| `backend/.firebaserc` | Your Firebase project ID |
| `frontend/config.tsx` | Your Google Places key and deployed API URL |
| `frontend/app.json` | Your Google Maps key and EAS project ID |
| `frontend/firebaseinit.tsx` | Your Firebase web config |
| `frontend/screens/SignInScreen.tsx` | Your Firebase web config and OAuth client IDs |
| `frontend/GoogleService-Info.plist` | Your iOS Firebase config |
| `frontend/google-services.json` | Your Android Firebase config |

Restrict your Google API keys in the Google Cloud console, and lock down your Realtime Database with Firebase security rules.

### 2. Run the backend

```bash
cd backend
yarn install
cp .env.example .env
```

Fill in `.env`, then load it and set up the database:

```bash
set -a; source .env; set +a
npx prisma migrate deploy
npx prisma generate
```

To add starting data such as universities and places, uncomment the steps you want in `main()` in `prisma/seed.ts` and run:

```bash
npx ts-node prisma/seed.ts
```

Then start the API, which listens on port 3001 by default:

```bash
yarn start
```

### 3. Deploy the cloud function

This function sends each new Firebase user to the API. The `server_recipient_key` value must match `FIREBASE_FUNCTIONS_RECIPIENT` in your backend `.env`.

```bash
cd backend/functions
npm install
firebase functions:config:set config.base_url="https://your-api.example.com" config.server_recipient_key="your-shared-secret"
npm run deploy
```

### 4. Run the app

```bash
cd frontend
yarn install
yarn ios
```

Use `yarn android` for Android. Development builds connect to the API at `http://localhost:3001`.

## Project structure

```text
backend/
  functions/    Firebase function that syncs new users
  prisma/       Database schema, migrations and seed data
  src/
    routes/     API routes for pools, chat, users and safety
    matching.ts Pool matching job
    notify.ts   Push notifications
frontend/
  dataAccess/   API clients
  navigation/   App navigation
  screens/      App screens
  slices/       Redux state
```

## Contributors

- [Shane Liu](https://github.com/shaneliu0)
- [Kesava](https://github.com/KesavaViswanadha)
