const express = require('express');
const router = express.Router();
const db = require('./config/db');

// A. Get all Pending payments for Admin Verification (transaction_id is NOT NULL)
router.get('/payments', async (req, res) => {
    try {
        // Sirf wahi dikhao jo Pending hain AUR jinka transaction_id resident ne bhar diya hai
        const query = `
            SELECT p.*, u.name AS user_name, u.flat_no 
            FROM payments p
            JOIN users u ON p.resident_id = u.id
            WHERE p.status = 'Pending' AND p.transaction_id IS NOT NULL 
            ORDER BY p.id DESC
        `;
        const [rows] = await db.query(query);
        res.status(200).json(rows); 
    } catch (err) {
        res.status(500).json({ error: "Failed to load payments" });
    }
});

// B. Verify specific payment
router.put('/verify-payment/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Status ko 'Pending' se 'Verified' karein
        const [result] = await db.query(
            "UPDATE payments SET status = 'Verified' WHERE id = ?", 
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Payment not found" });
        }
        
        res.json({ message: "Payment Verified!" }); // ✅ Success status bhejna zaroori hai
    } catch (err) {
        res.status(500).json({ error: "Database update failed" });
    }
});

// generate-bills route 
router.post('/generate-bills', async (req, res) => {
    const { amount } = req.body;
    const date = new Date();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();

    try {
        // 1. Check karein ki kya is mahine ka koi bhi bill pehle se hai?
        const [existing] = await db.query(
            "SELECT id FROM payments WHERE month_name = ? AND year = ?", 
            [month, year]
        );

        // ✅ Agar records hain, toh error bhej do (Duplicate rokne ke liye)
        if (existing.length > 0) {
            return res.status(400).json({ error: `Bills for ${month} ${year} already exist!` });
        }

        // 2. Agar nahi hain, toh hi naye banayein
        const [residents] = await db.query("SELECT id FROM users WHERE role = 'resident'");
        const queries = residents.map(r => 
            db.query(
                "INSERT INTO payments (resident_id, amount, status, method, month_name, year, payment_date) VALUES (?, ?, 'Pending', 'System Gen', ?, ?, NOW())", 
                [r.id, amount, month, year]
            )
        );
        await Promise.all(queries);
        res.json({ message: "✅ Monthly bills generated successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to generate bills" });
    }
});


// Resident Stats Sync (Corrected Sum Logic)
router.get('/resident-stats/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [dues] = await db.query(
           "SELECT SUM(amount) AS total FROM payments WHERE resident_id = ? AND status = 'Pending' AND transaction_id IS NULL", 
            [userId]
        );
        const [complaints] = await db.query("SELECT COUNT(*) AS total FROM complaints WHERE user_id = ? AND status != 'Resolved'", [userId]);
        const [notices] = await db.query("SELECT COUNT(*) AS total FROM notices");
        const [user] = await db.query("SELECT flat_no FROM users WHERE id = ?", [userId]);

        res.json({
            flat_no: user[0]?.flat_no || "N/A",
            pendingDues: dues[0]?.total || 0,
            openComplaints: complaints[0]?.total || 0,
            totalNotices: notices[0]?.total || 0
        });
    } catch (err) {
        res.status(500).json({ error: "Stats Error" });
    }
});

module.exports = router;