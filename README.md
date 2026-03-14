# CampusLens

A campus opportunity discovery app built with Expo (React Native) and a Python FastAPI backend.

---

## Prerequisites

- **Node.js** v18+ and **npm**
- **Python** 3.10+
- A **MongoDB Atlas** account (free tier works) — [cloud.mongodb.com](https://cloud.mongodb.com)
- _(Optional, for AI features)_ An **OpenRouter** API key — [openrouter.ai](https://openrouter.ai)

---

## Frontend Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
```

> If your backend is running on a different host/port, update this value.

### 3. Start the app

```bash
npx expo start
```

From there you can open in:
- **Expo Go** (scan QR code on your phone)
- **iOS Simulator** — press `i`
- **Android Emulator** — press `a`
- **Web browser** — press `w`

---

## Backend Setup

The backend is a Python FastAPI app located in the `backend/` directory.

### 1. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

> If `pip` isn't recognized, try `pip3` or `python -m pip install -r requirements.txt`

> **Python 3.12 users:** If you see a `ValueError: password cannot be longer than 72 bytes` error when registering, run:
> ```bash
> pip install bcrypt==4.0.1
> ```

### 2. Configure environment variables

Copy the example env file:

```bash
cp .env.example .env
```

Edit `backend/.env` with your values:

```env
# Required
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=campuslens

# JWT (defaults are fine for local dev)
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Optional — only needed for AI pathfinding / bootstrap features
AI_PROVIDER=openrouter
AI_API_KEY=your_openrouter_api_key_here
AI_MODEL=anthropic/claude-3-haiku
```

**Getting a MongoDB URI:**
1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Go to **Database > Connect > Drivers**
3. Copy the connection string and replace `<username>` and `<password>`

### 3. Start the backend

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. You can view the auto-generated API docs at `http://localhost:8000/docs`.

---

## Environment Variable Reference

### Frontend (`.env`)

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | Yes | Base URL of the backend API |

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | **Yes** | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | No | Database name (default: `campuslens`) |
| `JWT_SECRET_KEY` | No | Secret for signing JWT tokens |
| `JWT_ALGORITHM` | No | JWT algorithm (default: `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Token expiry in minutes (default: `10080` = 7 days) |
| `AI_PROVIDER` | No | AI provider (default: `openrouter`) |
| `AI_API_KEY` | No* | OpenRouter API key — required for AI features |
| `AI_MODEL` | No | AI model to use (default: `anthropic/claude-3-haiku`) |

> *AI features include pathfinding and AI building bootstrap. Basic auth, buildings, and opportunities work without it.

---

## Minimal Setup (no AI features)

To get login, registration, and opportunity browsing working you only need:

1. A MongoDB Atlas connection string in `backend/.env`
2. Backend running: `python -m uvicorn app.main:app --reload --port 8000`
3. Frontend running: `npx expo start`

---

## Git Workflow (Linear History)

This project uses a linear commit history — no merge commits. All PRs are merged via **Squash and Merge** on GitHub.

### Starting a new branch

Always branch off the latest `main`:

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### Keeping your branch up to date with main

If `main` has moved forward while you were working, rebase instead of merging:

```bash
git fetch origin
git rebase origin/main
```

If there are conflicts, Git will pause for you to resolve them. For each conflicted file:

```bash
# Edit the file to resolve the conflict, then:
git add <file>
git rebase --continue
```

To abort and go back to where you started:

```bash
git rebase --abort
```

### Opening a PR

Push your branch and open a PR against `main`:

```bash
git push -u origin your-branch-name
```

On GitHub, always select **Squash and Merge**. This collapses all commits on the branch into one clean commit on `main`.

### After your PR is merged

Update your local `main` and clean up the branch:

```bash
git checkout main
git pull origin main
git branch -d your-branch-name
```

---

## Project Structure

```
.
├── app/                  # Expo app screens (file-based routing)
│   ├── auth/             # Login & registration screens
│   ├── (tabs)/           # Main tab screens
│   └── building/         # Building detail screen
├── components/           # Shared UI components
├── context/              # React context (Auth, Toast)
├── lib/                  # API client and utilities
│   ├── api.ts            # All API calls
│   └── storage.ts        # Cross-platform secure storage wrapper
├── backend/              # Python FastAPI backend
│   ├── app/
│   │   ├── main.py       # FastAPI app and all routes
│   │   ├── auth.py       # JWT + password hashing
│   │   ├── db.py         # MongoDB connection
│   │   ├── models.py     # Pydantic data models
│   │   └── config.py     # Environment variable loading
│   └── requirements.txt
├── .env                  # Frontend env vars
└── .env.example          # Frontend env template
```
