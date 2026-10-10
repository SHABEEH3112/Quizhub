# Backend database

The backend stores all app data in `backend/data/quiz.sqlite` by default. Set `SQLITE_PATH` to use a different location.

Before the first SQLite startup, import existing MongoDB records once:

```powershell
cd backend
npm run migrate:sqlite
npm run dev
```

The migration reads `MONGO_URI` and optional `MONGO_DB_NAME` from `backend/.env`. It copies users, pending registrations, student profiles, quizzes, and attempts. It does not delete or modify MongoDB data, and it refuses to import into a non-empty SQLite database.

Back up `backend/data/quiz.sqlite` to preserve the local database.

## Vercel deployment

Vercel functions do not provide persistent local SQLite storage. Configure a
persistent MongoDB database and set these variables in the backend Vercel
project before deploying:

- `MONGO_URI` and, if needed, `MONGO_DB_NAME`
- `JWT_SECRET`
- `CLIENT_URL` set to the deployed frontend URL (for example,
  `https://quizhub-nine-nu.vercel.app`)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and
  `SMTP_FROM` for password-reset and verification emails

Set the frontend project's `VITE_API_URL` to the backend deployment URL, without
a trailing slash. Redeploy after changing environment variables. If MongoDB or
email credentials are missing or invalid, inspect the backend Vercel function
logs; the API will now report a configuration failure rather than silently
switching to non-persistent SQLite.