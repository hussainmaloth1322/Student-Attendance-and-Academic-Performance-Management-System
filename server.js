app.post('/api/faculty/register', async (req, res, next) => {
    try {
        const name = String(req.body.name || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const department = String(req.body.department || '').trim();
        const password = String(req.body.password || '');

        if (!name || !/^\S+@\S+\.\S+$/.test(email) ||
            !department || password.length < 8) {
            return res.status(400).json({
                error: 'Enter valid details. Password must have at least 8 characters.'
            });
        }

        const faculty = await db.createFaculty({
            name,
            email,
            department,
            password_hash: hashPassword(password)
        });

        res.status(201).json({
            message: 'Registration successful',
            faculty
        });

    } catch (error) {

        if (error.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({
                error: 'Email already registered'
            });
        }

        next(error);
    }
});