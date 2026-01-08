const bcrypt = require('bcryptjs'); 
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend'); 
const resend = new Resend(process.env.RESEND_API_KEY); // Direct key mat likho!// Yahan apni key paste karo; // Yahan apni key paste karo

module.exports = function(router, db) {

    // 1. Register Route
    router.post('/register', async (req, res) => {
        const { name, email, password, flat_no, role } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const finalRole = role || 'resident';

            await db.query(
                "INSERT INTO users (name, email, password, role, flat_no) VALUES (?, ?, ?, ?, ?)",
                [name, email, hashedPassword, finalRole, flat_no]
            );
            
            res.status(201).send(`User registered successfully as ${finalRole}!`);
        } catch (err) {
            console.error("Register Error:", err.message);
            if (err && err.code === 'ER_DUP_ENTRY') {
                return res.status(400).send('Email already exists');
            }
            res.status(500).send(err.message);
        }
    });

    // 2. Login Route
    router.post('/login', async (req, res) => {
        const { email, password } = req.body;
        try {
            const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
            if (users.length === 0) {
                return res.status(401).send("Invalid email or password.");
            }

            const user = users[0];
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(401).send("Invalid email or password.");
            }

            const token = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET || 'dev_secret',
                { expiresIn: '1h' }
            );

            res.json({
                message: "Login successful!",
                token: token,
                user: { id: user.id, name: user.name, role: user.role }
            });
        } catch (err) {
            console.error("Login Error:", err.message);
            res.status(500).send("System error during login.");
        }
    });

    // 3. Forgot Password Route
    router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const [users] = await db.query("SELECT id, name FROM users WHERE email = ?", [email]);
        if (users.length === 0) return res.status(404).send("Email not found.");

        const token = crypto.randomBytes(20).toString('hex');
        await db.query(
            "UPDATE users SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE email = ?",
            [token, email]
        );

        const FRONTEND_URL = "https://society-ease-app-k27x.onrender.com"; 
        const resetLink = `${FRONTEND_URL}/reset-password/${token}`;

        // Resend API se Real Email bhej rahe hain
        await resend.emails.send({
            from: 'onboarding@resend.dev', 
            to: email, // Aapka real gmail id
            subject: 'SocietyEase - Reset Password',
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
        });

        res.status(200).send("Reset link sent to your real Gmail!");

    } catch (err) {
        console.error("❌ ERROR:", err);
        res.status(500).send("System Error.");
    }
});

    // 4. Reset Password Route
    router.post('/reset-password/:token', async (req, res) => {
        const { token } = req.params;
        const { newPassword } = req.body;
        try {
            const [users] = await db.query(
                "SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
                [token]
            );

            if (users.length === 0) {
                return res.status(400).send("Invalid or expired reset token.");
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await db.query(
                "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
                [hashedPassword, users[0].id]
            );
            res.send("Password updated successfully!");
        } catch (err) {
            console.error(err);
            res.status(500).send("Error updating password.");
        }
    });
};