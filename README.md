# Student Attendance and Internal Marks Management System

A web application built with HTML, CSS, JavaScript, Node.js, Express and SQLite. Faculty can register and log in to manage branch-wise students, daily attendance, internal marks, academic performance and attendance percentages.

## Main workflow
1. Faculty registers with name, email, department and password.
2. Faculty logs in with the registered email and password.
3. Faculty dashboard provides access to all academic records.
4. Add/edit/delete students and filter students by branch.
5. Mark attendance for seven periods per day, optionally filtered by branch.
6. Enter internal marks by student, subject, semester and exam type.
7. View subject-wise marks performance and overall percentage.
8. View monthly attendance percentage and identify students below the selected threshold.

## Requirements and run
- Node.js 20 or later and npm
- Optional: Docker, Jenkins, Kubernetes and Chrome for Selenium

```bash
npm install
npm start
```
Open `http://localhost:3000`, choose **Faculty Registration**, create an account, then log in. Passwords are stored as salted scrypt hashes.

## Reports
Attendance percentage = Present periods / (Present periods + Absent periods) × 100. Unmarked periods are excluded. The performance report aggregates recorded internal marks for each student.

## Test
```bash
npm test
```
The automated tests require dependencies from `npm install`. Selenium additionally requires Chrome and a compatible driver.

## Docker
```bash
docker build -t student-attendance-system:latest .
docker run --name attendance-app -p 3000:3000 -v attendance-data:/app/database student-attendance-system:latest
```

## Jenkins and Kubernetes
The included `Jenkinsfile` and `k8s/deployment.yaml` are starter DevOps configurations. Configure the Node.js tool, Docker permissions and image registry for your environment before running a pipeline or deployment.

## Security note
Faculty session tokens are held in memory and are cleared when the server restarts. This is suitable for a classroom demo, not production. For production, use a persistent session store, HTTPS, secure cookies, rate limiting, account approval and role-based access. Do not commit real student data, database files or secrets.
