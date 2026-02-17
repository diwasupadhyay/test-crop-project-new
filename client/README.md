# Crop Price Predictor

Crop price prediction web app using Random Forest ML model. B.Tech CSE Capstone Project.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6
- **Auth**: Firebase (Email/Password + Google)
- **Backend**: Node.js, Express.js (planned)
- **Database**: MongoDB (planned)
- **ML**: Python, Random Forest (planned)
- **Deployment**: Docker, Nginx, Jenkins CI/CD

## Setup

```bash
cd client
npm install
npm run dev
```

Create a `.env` file in `client/` (see `.env.example` for required keys).

## Docker

```bash
docker build -t crop-predictor .
docker run -p 80:80 crop-predictor
```

## Pages

- `/` — Home (scroll animations, project overview, team)
- `/crops` — Crop database with filter
- `/prediction` — Price prediction (requires login)
- `/login` — Login (email + Google)
- `/signup` — Sign up (email + Google)

## Project Structure

```
client/
  src/
    components/   # Navbar, Footer, ProtectedRoute, animations
    context/      # AuthContext (Firebase)
    pages/        # Home, Crops, Prediction, Login, Signup
    styles/       # Tailwind + custom CSS
  Dockerfile
  Jenkinsfile
  docker-compose.yml
  nginx.conf
```

## License

B.Tech CSE Capstone 1 Project.
