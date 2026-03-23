# CampusLens

**CampusLens** helps students discover opportunities on campus — clubs, research positions, events, and more — through an interactive skill-tree graph, AI-powered career pathfinding, and AR exploration. Built with Expo (React Native) and a Python FastAPI backend.

### Key Features

- **Skill-tree graph** — visualize how opportunities connect and build toward your goals
- **AI pathfinding** — get personalized milestone recommendations based on your profile
- **Profile builder** — guided onboarding to capture your interests, skills, and career goals
- **AR campus overlay** — discover opportunities by pointing your camera at campus buildings
- **Golden path** — curated sequences of opportunities tailored to your trajectory
- **Opportunity tracking** — save and manage opportunities you're interested in

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

### Testing on a physical iOS device

Testing on a physical iPhone requires a few extra steps because your phone needs to reach both the **Expo Metro bundler** (port 8081) and the **FastAPI backend** (port 8000) running on your computer.

#### Step 1: Load the app bundle via tunnel

When scanning the QR code on an iPhone, you may get a "request timed out" error. This happens because Windows Firewall typically blocks incoming connections on port 8081, so your phone can't download the JS bundle from Metro.

Use tunnel mode, which routes the bundle through Expo's servers instead:

```bash
npx expo start --tunnel --clear
```

> **Note:** Tunnel mode requires `@expo/ngrok`. If prompted, install it with:
> ```bash
> npm install -g @expo/ngrok@^4.0.0
> ```

#### Step 2: Make the backend reachable from your phone

The app on your phone makes API calls directly to the backend. `localhost` won't work — that points to the phone itself, not your computer. You need to use your computer's IP address, and your phone must be able to reach it.

**The most reliable method: use your iPhone's Personal Hotspot**

Router Wi-Fi networks often have "AP Isolation" enabled, which blocks devices on the same network from talking to each other. Using your phone's hotspot avoids this entirely.

1. On your iPhone, enable **Personal Hotspot** (Settings → Personal Hotspot)
2. Connect your **computer** to your phone's hotspot via Wi-Fi
3. Find your computer's new IP address — run in PowerShell:
   ```
   ipconfig
   ```
   Look for `IPv4 Address` under the Wi-Fi adapter — it will be something like `172.20.10.7`
4. Update `.env` with that IP:
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://172.20.10.7:8000
   ```
5. Start the backend bound to all interfaces:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
   ```
6. Verify it works by opening `http://172.20.10.7:8000/health` in your phone's browser — it should return `{"status":"ok"}`
7. Restart Expo: `npx expo start --tunnel --clear`

> **Note:** Your computer's IP changes every time you reconnect to a network. Remember to re-run `ipconfig` and update `.env` if you switch networks.

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
├── app/                      # Expo app screens (file-based routing)
│   ├── (tabs)/               # Main navigation
│   │   ├── index.tsx         # Home / Discovery feed
│   │   ├── golden-path.tsx   # AI career path discovery
│   │   ├── graph.tsx         # Connection graph view
│   │   ├── my-opportunities.tsx # Saved interests
│   │   └── profile.tsx       # Profile & skills overview
│   ├── auth/                 # Login & registration flows
│   ├── building/             # Building & opportunity details
│   ├── dev/                  # Developer tools (AI bootstrap)
│   └── profile-builder/      # Onboarding flows
├── components/               # Shared UI components
│   ├── SkillTree.tsx         # Interactive skill-tree viz
│   ├── MagicButton.tsx       # Main action button
│   └── ...
├── context/                  # React context providers
│   ├── AuthContext.tsx        # Auth state mgmt
│   ├── GraphContext.tsx       # Skill-tree data mgmt
│   ├── OnboardingContext.tsx  # Flow tracking
│   └── ToastContext.tsx      # App notifications
├── hooks/                    # Custom React hooks (AR, etc.)
├── lib/                      # Shared utilities & API client
├── src/arOverlay/            # AR overlay assets & logic
└── backend/                  # Python FastAPI backend
    ├── app/                  # REST API application (main, models, ai_client, etc.)
    └── scripts/              # Data seeding & utility scripts
├── .env                      # App environment variables
└── .env.example              # Env template
```
