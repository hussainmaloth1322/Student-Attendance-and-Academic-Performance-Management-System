
pipeline {
    agent any

    environment {
        DOCKER_HOST = 'npipe:////./pipe/dockerDesktopLinuxEngine'
        IMAGE_NAME = 'student-attendance-system'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo 'GitHub repository checked out successfully.'
            }
        }

        stage('Check Node and npm') {
            steps {
                bat 'node --version'
                bat 'npm --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Run Tests') {
            steps {
                bat 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat '''
                    echo Checking Docker executable...

                    "C:\\Users\\Maloth Hussain\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker.exe" version

                    if errorlevel 1 exit /b 1

                    echo Building Docker image...

                    "C:\\Users\\Maloth Hussain\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker.exe" build -t %IMAGE_NAME% .

                    if errorlevel 1 exit /b 1

                    echo Docker image created successfully!

                    "C:\\Users\\Maloth Hussain\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker.exe" images
                '''
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: Student Attendance System pipeline completed!'
        }

        failure {
            echo 'FAILURE: Check the Console Output for errors.'
        }

        always {
            echo 'Jenkins pipeline execution finished.'
        }
    }
}
