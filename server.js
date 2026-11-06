
const express = require('express');
const path = require('path');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Password hashing
const crypto = require('crypto');

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

// Error handler
app.use((err, req, res, next) => {
    console.error(err);

    res.status(500).json({
        error: 'Internal server error'
    });
});

// Start server only when run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Student Attendance System running at http://localhost:${PORT}`);
    });
}

// Export app for tests
module.exports = app;
