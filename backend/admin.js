const express = require('express');
const router = express.Router();
const db = require('./config/db');

// A. Get all Pending payments for Admin Verification (transaction_id is NOT NULL)
// admin.js mein payments fetch route update karein
router.get('/payments', async (req, res) => {
    try {
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
        await db.query("UPDATE payments SET status = 'Verified' WHERE id = ?", [id]);
        res.status(200).json({ message: "✅ Payment Verified Successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

// C. Generate Monthly Bills (System Generated Entry)
// admin.js mein bill generation route ko aise update karein
router.post('/generate-bills', async (req, res) => {
    const { amount, month, year } = req.body;
    try {
        const [residents] = await db.query("SELECT id FROM users WHERE role = 'resident'");
        
        // Har resident ke liye ek "Pending" entry banegi bina kisi transaction details ke
        const queries = residents.map(r => 
            db.query(
                "INSERT INTO payments (resident_id, amount, status, method, month_name, year, payment_date, transaction_id) VALUES (?, ?, 'Pending', 'System Gen', ?, ?, NOW(), NULL)", 
                [r.id, amount, month, year]
            )
        );
        await Promise.all(queries);
        res.json({ message: "✅ Monthly bills generated successfully for all residents!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to generate bills" });
    }
});

// D. Resident Dashboard Stats Sync (Corrected Sum Logic)
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