pipeline {
    agent any

    environment {
        DOCKER_IMAGE_CLIENT = 'crop-client'
        DOCKER_IMAGE_SERVER = 'crop-server'
        DOCKER_TAG          = "${env.BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup Environment') {
            steps {
                // Inject server .env from Jenkins credentials
                withCredentials([file(credentialsId: 'crop-server-env', variable: 'SERVER_ENV')]) {
                    bat 'copy "%SERVER_ENV%" server\\.env'
                }
                // Inject client .env from Jenkins credentials
                withCredentials([file(credentialsId: 'crop-client-env', variable: 'CLIENT_ENV')]) {
                    bat 'copy "%CLIENT_ENV%" client\\.env'
                }
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Server Dependencies') {
                    steps {
                        dir('server') {
                            bat 'npm ci'
                        }
                    }
                }
                stage('Client Dependencies') {
                    steps {
                        dir('client') {
                            bat 'npm ci'
                        }
                    }
                }
            }
        }

        stage('Build Client') {
            steps {
                dir('client') {
                    bat 'npm run build'
                }
            }
        }

        stage('Docker Build') {
            parallel {
                stage('Build Server Image') {
                    steps {
                        bat "docker build -t %DOCKER_IMAGE_SERVER%:%DOCKER_TAG% ./server"
                        bat "docker tag %DOCKER_IMAGE_SERVER%:%DOCKER_TAG% %DOCKER_IMAGE_SERVER%:latest"
                    }
                }
                stage('Build Client Image') {
                    steps {
                        bat "docker build -t %DOCKER_IMAGE_CLIENT%:%DOCKER_TAG% ./client"
                        bat "docker tag %DOCKER_IMAGE_CLIENT%:%DOCKER_TAG% %DOCKER_IMAGE_CLIENT%:latest"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                // Stop existing containers
                bat 'docker-compose down || exit 0'
                // Start fresh
                bat 'docker-compose up --build -d'
            }
        }

        stage('Health Check') {
            steps {
                // Wait for services to start
                bat 'timeout /t 15 /nobreak >nul'
                // Verify backend health
                bat 'curl -f http://localhost:5000/api/health || exit 1'
                // Verify frontend serves
                bat 'curl -f http://localhost:3000 || exit 1'
                echo 'Health checks passed!'
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully! App is live.'
        }
        failure {
            echo 'Pipeline failed. Check logs above.'
            // Try to show container logs on failure
            bat 'docker-compose logs --tail=50 || exit 0'
        }
        always {
            cleanWs()
        }
    }
}
