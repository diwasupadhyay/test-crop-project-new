pipeline {
    agent any

    stages {
        // ── 1. Pull latest code ──────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // ── 2. Inject secrets ────────────────────────────────
        stage('Setup Environment') {
            steps {
                // Copy server .env (Secret File credential)
                withCredentials([file(credentialsId: 'crop-server-env', variable: 'SERVER_ENV')]) {
                    bat 'copy "%SERVER_ENV%" server\\.env'
                }
                // Copy ml-service .env (Secret File credential)
                withCredentials([file(credentialsId: 'crop-ml-env', variable: 'ML_ENV')]) {
                    bat 'copy "%ML_ENV%" ml-service\\.env'
                }
                // Write VITE_GOOGLE_CLIENT_ID for docker-compose build arg (Secret Text credential)
                withCredentials([string(credentialsId: 'crop-google-client-id', variable: 'GCID')]) {
                    bat 'echo VITE_GOOGLE_CLIENT_ID=%GCID%> .env'
                }
            }
        }

        // ── 3. Download ML dependencies (runs on host, fast) ─
        stage('Prepare ML Wheels') {
            steps {
                bat 'pip download --dest ml-service\\wheels --python-version 3.10 --platform manylinux2014_x86_64 --platform manylinux_2_17_x86_64 --only-binary=:all: -r ml-service\\requirements.txt 2>nul || exit 0'
            }
        }

        // ── 4. Build & Deploy with Docker Compose ────────────
        stage('Build & Deploy') {
            steps {
                bat 'docker-compose down --remove-orphans 2>nul || exit 0'
                bat 'docker rm -f test-crop-server test-crop-client test-crop-ml 2>nul || exit 0'
                bat 'docker-compose up --build -d'
            }
        }

        // ── 5. Verify everything is running ──────────────────
        stage('Health Check') {
            steps {
                // Wait for ML service to fetch data + train model on first run (~2 min)
                bat 'ping -n 150 127.0.0.1 >nul'
                bat 'curl -f http://localhost:5000/api/health || exit 1'
                bat 'curl -f http://localhost:5001/health || exit 1'
                bat 'curl -f http://localhost:3000 || exit 1'
                echo 'All services are healthy!'
            }
        }
    }

    post {
        success {
            echo 'Deployment successful! App is running at http://localhost:3000'
        }
        failure {
            echo 'Pipeline failed! Container logs:'
            bat 'docker-compose logs --tail=30 2>nul || exit 0'
        }
    }
}
