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