const bcrypt = require('bcryptjs'); 
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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
        if (users.length === 0) {
            return res.status(404).send("Email not found.");
        }

        const token = crypto.randomBytes(20).toString('hex');
        await db.query(
            "UPDATE users SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE email = ?",
            [token, email]
        );

        const FRONTEND_URL = "https://society-ease-app-k27x.onrender.com"; 
        const resetLink = `${FRONTEND_URL}/reset-password/${token}`;

        // Mailtrap Configuration
        const transporter = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "8600917e30da5c", // Mailtrap Username
                pass: "94162853d8bbcc"  // Mailtrap Password
            }
        });

        const mailOptions = {
            from: 'no-reply@societyease.com', // Aapka verify kiya hua sender
            to: email,
            subject: 'SocietyEase - Password Reset',
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password. Valid for 1 hour.</p>`
        };

        // 🚀 Pehle Response bhej do taaki Frontend timeout na kare
        res.status(200).send("Reset link processed! Check your Mailtrap inbox.");

        // Email background mein bhejte raho
        transporter.sendMail(mailOptions)
            .then(() => console.log("✅ Email sent to Mailtrap successfully"))
            .catch(mailError => console.error("❌ NODEMAILER ERROR:", mailError));

    } catch (err) {
        console.error("❌ SYSTEM ERROR:", err); 
        if (!res.headersSent) {
            res.status(500).send(`Error: ${err.message}`);
        }
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