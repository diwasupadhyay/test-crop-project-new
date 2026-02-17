# Crop Price Predictor

AI-driven crop price prediction platform built as a B.Tech CSE Capstone Project.

---

## Tech Stack

| Layer    | Technology                                  |
| -------- | ------------------------------------------- |
| Frontend | React 18, Vite 5, Tailwind CSS 3            |
| Backend  | Node.js, Express 4, Mongoose 8              |
| Database | MongoDB Atlas                               |
| Auth     | JWT + bcrypt (email/password), Google OAuth  |
| DevOps   | Docker, Docker Compose, Jenkins, Nginx      |

---

## Project Structure

```
test-crop-project/
├── client/                  # React Frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # AuthContext (JWT-based)
│   │   ├── pages/           # Route pages
│   │   ├── styles/          # Tailwind + custom CSS
│   │   ├── firebase.js      # API URL config (no Firebase)
│   │   └── main.jsx         # App entry point
│   ├── public/sequence/     # Scroll animation frames
│   ├── Dockerfile           # Multi-stage Nginx build
│   ├── nginx.conf           # Nginx config with API proxy
│   └── package.json
│
├── server/                  # Express Backend
│   ├── models/User.js       # Mongoose user model
│   ├── routes/auth.js       # Auth endpoints
│   ├── middleware/auth.js   # JWT verification
│   ├── server.js            # Express entry point
│   ├── Dockerfile           # Node.js production image
│   └── package.json
│
├── docker-compose.yml       # Full-stack orchestration
├── Jenkinsfile              # CI/CD pipeline
└── .gitignore
```

---

## Prerequisites

- **Node.js** 18+ → [Download](https://nodejs.org/)
- **Docker Desktop** → [Download](https://www.docker.com/products/docker-desktop/)
- **Git** → [Download](https://git-scm.com/)
- **MongoDB Atlas** account → [Sign up](https://www.mongodb.com/atlas)
- **Google Cloud Console** project (for Google OAuth) → [Console](https://console.cloud.google.com/)

---

## Step-by-Step Setup Guide

### 1. Clone the Repository

```bash
git clone https://github.com/diwasupadhyay/test-crop-project-new.git
cd test-crop-project-new
```

### 2. Setup MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free cluster (M0)
3. Create a database user with password
4. Whitelist your IP (or `0.0.0.0/0` for development)
5. Click **Connect** → **Drivers** → Copy the connection string
6. Replace `<password>` in the string with your actual password

### 3. Setup Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add **Authorized JavaScript origins**:
   - `http://localhost:3000` (development)
   - Your production domain
7. Add **Authorized redirect URIs**:
   - `http://localhost:3000`
8. Copy the **Client ID**

### 4. Configure Environment Variables

#### Server (`server/.env`)
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/crop-predictor?appName=<appname>
JWT_SECRET=your_random_secret_key_min_32_chars
PORT=5000
CLIENT_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id_here
```

#### Client (`client/.env`)
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

> **Note:** `.env` files are gitignored. Copy from `.env.example` files as templates.

### 5. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 6. Run in Development Mode

Open two terminals:

```bash
# Terminal 1 — Backend (port 5000)
cd server
npm run dev
```

```bash
# Terminal 2 — Frontend (port 3000)
cd client
npm run dev
```

The app is now live at **http://localhost:3000**

---

## Docker Deployment

### Quick Start with Docker Compose

```bash
# From project root
docker-compose up --build -d
```

This will:
1. Build the **server** image (Node.js + Express)
2. Build the **client** image (Vite build → Nginx)
3. Start both containers on a shared network
4. Nginx proxies `/api/*` requests to the backend

| Service | URL                    |
| ------- | ---------------------- |
| Frontend | http://localhost:3000  |
| Backend  | http://localhost:5000  |

### Stop Containers

```bash
docker-compose down
```

### View Logs

```bash
docker-compose logs -f          # All services
docker-compose logs -f server   # Backend only
docker-compose logs -f client   # Frontend only
```

### Rebuild After Code Changes

```bash
docker-compose up --build -d
```

---

## CI/CD Pipeline (Jenkins)

### Architecture

```
Git Push → Jenkins Detects → Checkout → Setup Env → Install Deps
→ Build Client → Docker Build (parallel) → Deploy → Health Check
```

### Jenkins Setup (Step-by-Step)

#### Step 1: Install Jenkins

1. Download Jenkins from [jenkins.io](https://www.jenkins.io/download/)
2. Install and start Jenkins (default: http://localhost:8080)
3. Complete the initial setup wizard
4. Install suggested plugins

#### Step 2: Install Required Plugins

Go to **Manage Jenkins** → **Plugins** → **Available** and install:
- **Pipeline** (usually pre-installed)
- **Git** (usually pre-installed)
- **Docker Pipeline**
- **Credentials Binding**

#### Step 3: Add Credentials

Go to **Manage Jenkins** → **Credentials** → **System** → **Global credentials** → **Add Credentials**

**Credential 1 — Server .env file:**
- Kind: **Secret file**
- File: Upload your `server/.env` file
- ID: `crop-server-env`
- Description: Server environment variables

**Credential 2 — Client .env file:**
- Kind: **Secret file**
- File: Upload your `client/.env` file
- ID: `crop-client-env`
- Description: Client environment variables

#### Step 4: Create Pipeline Job

1. Click **New Item** → Name: `crop-price-predictor` → **Pipeline** → OK
2. Under **Pipeline**:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/diwasupadhyay/test-crop-project-new.git`
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`
3. Click **Save**

#### Step 5: Run the Pipeline

1. Click **Build Now**
2. Watch the pipeline stages execute:
   - **Checkout** — Pulls code from GitHub
   - **Setup Environment** — Injects `.env` files from credentials
   - **Install Dependencies** — Runs `npm ci` for both client and server (parallel)
   - **Build Client** — Runs `vite build`
   - **Docker Build** — Builds both images (parallel)
   - **Deploy** — Runs `docker-compose up --build -d`
   - **Health Check** — Verifies both services respond

#### Step 6: Enable Auto-Build on Push (Optional)

1. In Jenkins job config, check **GitHub hook trigger for GITScm polling**
2. In GitHub repo → **Settings** → **Webhooks** → **Add webhook**:
   - Payload URL: `http://<your-jenkins-url>/github-webhook/`
   - Content type: `application/json`
   - Trigger: **Just the push event**

---

## API Endpoints

| Method | Endpoint         | Auth   | Description           |
| ------ | ---------------- | ------ | --------------------- |
| POST   | `/api/auth/register` | No | Create new account |
| POST   | `/api/auth/login`    | No | Login with email/password |
| POST   | `/api/auth/google`   | No | Login/register with Google |
| GET    | `/api/auth/me`       | JWT | Get current user profile |
| GET    | `/api/health`        | No | Health check |

### Auth Flow

```
Register/Login → Server returns JWT token
→ Client stores token in localStorage
→ Subsequent requests include: Authorization: Bearer <token>
→ JWT middleware verifies token → Grants access
```

---

## Application Pages

| Route        | Component   | Auth Required | Description                    |
| ------------ | ----------- | ------------- | ------------------------------ |
| `/`          | Home        | No            | Hero, About, How It Works, Team |
| `/crops`     | Crops       | No            | Crop database with filtering   |
| `/prediction`| Prediction  | Yes           | Price prediction (Coming Soon) |
| `/login`     | Login       | No            | Email/password + Google login  |
| `/signup`    | Signup      | No            | Registration + Google signup   |

---

## Security Features

- Passwords hashed with **bcrypt** (12 salt rounds)
- **JWT tokens** with 7-day expiry
- Google OAuth token verified server-side via Google API
- `.env` files excluded from Git via `.gitignore`
- Nginx security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- CORS restricted to client origin only
- No sensitive data in API responses (password stripped from User model)

---

## Troubleshooting

| Issue | Solution |
| ----- | -------- |
| `MONGODB_URI` connection error | Check IP whitelist in Atlas, verify password |
| Google login `redirect_uri_mismatch` | Add `http://localhost:3000` to Authorized JS origins in Google Console |
| Port already in use | Kill existing process: `npx kill-port 3000 5000` |
| Docker build fails | Ensure Docker Desktop is running |
| Jenkins can't find Docker | Add Docker to system PATH, restart Jenkins |

---

## Team

| Name          | Role               |
| ------------- | ------------------ |
| Rahul Sharma  | ML Engineer        |
| Priya Patel   | Frontend Developer |
| Amit Kumar    | Backend Developer  |
| Sneha Reddy   | Data Analyst       |

---

## License

This project is part of a B.Tech CSE Capstone Project at NIIT University.
