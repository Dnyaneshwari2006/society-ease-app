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
        console.error("Fetch Error:", err);
        res.status(500).json({ error: "Failed to load payments" });
    }
});

// B. Verify specific payment 
router.put('/verify-payment/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; 
    try {
        const query = "UPDATE payments SET status = ? WHERE id = ?";
        const [result] = await db.query(query, [status, id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Payment not found" });
        res.status(200).json({ message: "Payment Verified Successfully!", status });
    } catch (err) {
        res.status(500).json({ error: "Database error during verification" });
    }
});

// C. Generate Monthly Maintenance Bills
router.post('/generate-bills', async (req, res) => {
    const { amount, month, year } = req.body;
    try {
        const [residents] = await db.query("SELECT id FROM users WHERE role = 'resident'");
        const queries = residents.map(r => 
            db.query(
            "INSERT INTO payments (resident_id, amount, status, method, month_name, year, payment_date) VALUES (?, ?, 'Pending', 'System Gen', ?, ?, NOW())",
            [r.id, amount, month, year]
        ));
        await Promise.all(queries);
        res.json({ message: "Bills generated successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// D. Get Resident Stats (Calculates Pending Dues)
router.get('/resident-stats/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // Only sums bills that haven't been paid (transaction_id is NULL)
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
        console.error("❌ Stats Error:", err);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

// ✅ module.exports hamesha end mein hona chahiye
module.exports = router;