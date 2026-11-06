
const express = require('express');
const path = require('path');
const db = require('./database/db');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Password hashing
function hashPassword(password) {
    return crypto
        .createHash('sha256')
        .update(password)
        .digest('hex');
}

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Faculty Registration
app.post('/api/faculty/register', async (req, res, next) => {
    try {
        const name = String(req.body.name || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        if (
            !name ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            password.length < 8
        ) {
            return res.status(400).json({
                error: 'Enter valid details. Password must have at least 8 characters.'
            });
        }

        const faculty = await db.createFaculty({
            name,
            email,
            department: '',
            password_hash: hashPassword(password)
        });

        return res.status(201).json({
            message: 'Registration successful',
            faculty
        });

    } catch (error) {
        if (
            error.code === 'SQLITE_CONSTRAINT' ||
            error.code === 'SQLITE_CONSTRAINT_UNIQUE'
        ) {
            return res.status(409).json({
                error: 'Email already registered'
            });
        }

        next(error);
    }
});

// Get all students
app.get('/api/students', async (req, res, next) => {
    try {
        const students = await db.getStudents();
        res.status(200).json(students);
    } catch (error) {
        next(error);
    }
});

// Add a student
app.post('/api/students', async (req, res, next) => {
    try {
        const roll_no = String(req.body.roll_no || '').trim();
        const name = String(req.body.name || '').trim();
        const department = String(req.body.department || '').trim();

        if (!roll_no || !name) {
            return res.status(400).json({
                error: 'Roll number and student name are required'
            });
        }

        const student = await db.addStudent({
            roll_no,
            name,
            department
        });

        res.status(201).json({
            message: 'Student added successfully',
            student
        });

    } catch (error) {
        if (
            error.code === 'SQLITE_CONSTRAINT' ||
            error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' ||
            error.code === 'SQLITE_CONSTRAINT_UNIQUE'
        ) {
            return res.status(409).json({
                error: 'Student roll number already exists'
            });
        }

        next(error);
    }
});

// Get attendance by date
app.get('/api/attendance', async (req, res, next) => {
    try {
        const date = String(req.query.date || '');

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                error: 'A valid date is required (YYYY-MM-DD)'
            });
        }

        const records = await db.getAttendance(date);
        res.status(200).json(records);

    } catch (error) {
        next(error);
    }
});

// Save attendance
app.post('/api/attendance', async (req, res, next) => {
    try {
        const date = String(req.body.date || '');
        const records = req.body.records;

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                error: 'A valid date is required (YYYY-MM-DD)'
            });
        }

        if (!Array.isArray(records)) {
            return res.status(400).json({
                error: 'Attendance records must be an array'
            });
        }

        for (const record of records) {
            const period = Number(record.period);

            if (
                !record.roll_no ||
                !Number.isInteger(period) ||
                period < 1 ||
                period > 7 ||
                !['Present', 'Absent'].includes(record.status)
            ) {
                return res.status(400).json({
                    error: 'Invalid attendance record'
                });
            }
        }

        await db.saveAttendance(date, records);

        res.status(200).json({
            message: 'Attendance saved successfully'
        });

    } catch (error) {
        if (error.message && error.message.startsWith('Unknown student')) {
            return res.status(400).json({
                error: error.message
            });
        }

        next(error);
    }
});

// Monthly attendance report
app.get('/api/reports/monthly', async (req, res, next) => {
    try {
        const month = String(req.query.month || '');
        const threshold = Number(req.query.threshold ?? 75);

        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
            return res.status(400).json({
                error: 'Month must be in YYYY-MM format'
            });
        }

        if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
            return res.status(400).json({
                error: 'Threshold must be between 0 and 100'
            });
        }

        const report = await db.getMonthlyReport(month, threshold);

        res.status(200).json(report);

    } catch (error) {
        next(error);
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);

    res.status(500).json({
        error: 'Internal server error'
    });
});

// Start server only when run directly
if (require.main === module) {
    db.init()
        .then(() => {
            app.listen(PORT, () => {
                console.log(
                    `Student Attendance System running at http://localhost:${PORT}`
                );
            });
        })
        .catch(error => {
            console.error('Database initialization failed:', error);
            process.exit(1);
        });
}

module.exports = app;
