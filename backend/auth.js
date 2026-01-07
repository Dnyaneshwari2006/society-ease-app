const bcrypt = require('bcryptjs'); // ✅ Ensure this is bcryptjs
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

module.exports = function(app, db) {

    // 1. Login Route (Safer and Logs errors)
    app.post('/login', async (req, res) => {
        const { email, password } = req.body;
        try {
            const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
            if (users.length === 0) {
                return res.status(401).send("Invalid email or password.");
            }

            const user = users[0];
            // Match password
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                console.log(`❌ Password mismatch for: ${email}`);
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

    // 2. Forgot Password (Link Fixed for Render)
    app.post('/forgot-password', async (req, res) => {
        const { email } = req.body;
        try {
            const [users] = await db.query("SELECT id, name FROM users WHERE email = ?", [email]);
            if (users.length === 0) {
                return res.status(404).send("Email not found.");
            }

            const token = crypto.randomBytes(20).toString('hex');

            await db.query(
                "UPDATE users SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE email = ?",
                [token, email]
            );

            // ✅ BADLO: Localhost ko apne Render Frontend URL se replace karein
            const FRONTEND_URL = "https://society-ease-app.onrender.com"; 
            const resetLink = `${FRONTEND_URL}/reset-password/${token}`;

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
                tls: { rejectUnauthorized: false }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'SocietyEase - Password Reset',
                html: `<p>Click <a href="${resetLink}">here</a> to reset your password. Valid for 1 hour.</p>`
            };

            await transporter.sendMail(mailOptions);
            res.send("Reset link sent to your email!");
        } catch (err) {
            console.error("FORGOT ERROR:", err);
            res.status(500).send("Error generating reset link.");
        }
    });

    // 4. Reset Password Route
    app.post('/reset-password/:token', async (req, res) => {
        const { token } = req.params;
        const { newPassword } = req.body;

        try {
            // Check if token exists and if it is still valid using DB time
            const [users] = await db.query(
                "SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
                [token]
            );

            if (users.length === 0) {
                return res.status(400).send("Invalid or expired reset token. Please request a new link.");
            }

            // Hash the NEW password before saving
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