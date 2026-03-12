# Crop Price Predictor

A full-stack web application that predicts crop market prices using machine learning, helping farmers make smarter selling decisions.

**[Live Demo →](https://croppriceprediction.app)**

---

## What It Does

Users select a crop, enter their region and timeframe, and the app predicts the expected market price using a trained ML model. It compares the prediction against current prices so farmers can decide the best time to sell.

---

## Features

- **ML-Powered Predictions** — Random Forest model trained on historical price data
- **Multi-Crop Support** — Wheat, Rice, Maize, Cotton, Sugarcane
- **Real-Time Comparison** — Shows predicted vs current market price
- **Auth System** — JWT + Google OAuth with role-based access
- **Admin Panel** — Retrain the ML model and manage datasets
- **Fully Dockerized** — Three services orchestrated with Docker Compose
- **CI/CD** — Automated build & deploy pipeline via Jenkins

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express, MongoDB |
| ML Service | Python, Flask, scikit-learn, pandas |
| DevOps | Docker, Docker Compose, Jenkins, Nginx |

---

## How It Works

1. **User selects a crop** and enters location + month/year
2. **Frontend** sends request to the Node.js backend
3. **Backend** forwards it to the Python ML microservice
4. **ML Service** runs the trained Random Forest model on the input
5. **Prediction** is returned with a comparison to the current market price

---

## Architecture

```
Client (React)  →  Server (Express)  →  ML Service (Flask)
     ↕                   ↕                      ↕
   Nginx             MongoDB              scikit-learn
```

All three services run as Docker containers, connected via Docker Compose.

---

## Project Structure

```
├── client/          React frontend (Vite + Tailwind)
├── server/          Express API + MongoDB
├── ml-service/      Python ML prediction service
├── docker-compose.yml
└── Jenkinsfile      CI/CD pipeline
```

---

## Author

**Diwas Upadhyay** — [GitHub](https://github.com/diwasupadhyay) · [LinkedIn](https://linkedin.com/in/diwasupadhyay)
