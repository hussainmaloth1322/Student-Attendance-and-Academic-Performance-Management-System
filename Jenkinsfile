
pipeline {
    agent any

    stages {

        stage('Git Checkout') {
            steps {
                echo 'Downloading Student Attendance System'
                checkout scm
            }
        }

        stage('Check Node and NPM') {
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

        stage('Build') {
            steps {
                echo 'Checking project files'
                bat 'node --check server.js'
                bat 'npm run build --if-present'
            }
        }

        stage('Test') {
            steps {
                bat 'npm test --if-present'
            }
        }
    }

    post {
        success {
            echo 'Student Attendance System pipeline completed successfully!'
        }

        failure {
            echo 'Pipeline failed. Check the Console Output.'
        }
    }
}
