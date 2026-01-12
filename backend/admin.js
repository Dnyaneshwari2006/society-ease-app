const express = require('express');
const router = express.Router();
const db = require('./config/db');

// A. Get all Pending payments for Admin Verification
router.get('/payments', async (req, res) => {
    try {
        const query = `
            SELECT p.*, u.name AS user_name, u.flat_no 
            FROM payments p
            JOIN users u ON p.resident_id = u.id
            WHERE p.status = 'Pending' 
            ORDER BY p.id DESC
        `;
        const [rows] = await db.query(query);
        res.status(200).json(rows); 
    } catch (err) {
        res.status(500).json({ error: "Failed to load payments" });
    }
});

// B. Verify specific payment (Amount verified hote hi revenue mein jayega)
router.put('/verify-payment/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE payments SET status = 'Verified' WHERE id = ?", [id]);
        res.status(200).json({ message: "Verified Successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

// C. Generate Monthly Bills (System Generated Entry)
router.post('/generate-bills', async (req, res) => {
    const { amount, month, year } = req.body;
    try {
        const [residents] = await db.query("SELECT id FROM users WHERE role = 'resident'");
        const queries = residents.map(r => 
            db.query(
                "INSERT INTO payments (resident_id, amount, status, method, month_name, year, payment_date) VALUES (?, ?, 'Pending', 'System Gen', ?, ?, NOW())", 
                [r.id, amount, month, year]
            )
        );
        await Promise.all(queries);
        res.json({ message: "Bills generated for all residents!" });
    } catch (err) {
        res.status(500).json({ error: "Truncated or DB Error" });
    }
});

// D. Resident Dashboard Stats (The Real Fix for Amount)
router.get('/resident-stats/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // ✅ FIX: Sum only unpaid bills (transaction_id is NULL)
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