
app.post('/api/faculty/register', async (req, res, next) => {
    try {
        const name = String(req.body.name || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        // Validate input
        if (
            !name ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            password.length < 8
        ) {
            return res.status(400).json({
                error: 'Enter valid name and email. Password must contain at least 8 characters.'
            });
        }

        // Create faculty account
        const faculty = await db.createFaculty({
            name,
            email,
            password_hash: hashPassword(password)
        });

        return res.status(201).json({
            message: 'Faculty registration successful',
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
