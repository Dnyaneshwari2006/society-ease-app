const express = require('express');
const router = express.Router();
const db = require('./db');

// 1. GET: Fetch all payments for Tracker
router.get('/payments', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT mp.*, u.username AS user_name 
            FROM maintenance_payments mp
            JOIN users u ON mp.user_id = u.id
            WHERE mp.status != 'Paid' 
            ORDER BY mp.payment_date DESC
        `);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch payments" });
    }
});

// 2. PUT: Verify specific month payment
router.put('/verify-payment/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Sirf wahi ID update hogi jise click kiya gaya (Manual Control)
        const [result] = await db.query(
            "UPDATE maintenance_payments SET status = 'Verified' WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) return res.status(404).send("Record not found");
        
        res.status(200).json({ message: "Payment verified successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Verification failed" });
    }
});

// 3. POST: Generate monthly bills for all residents
router.post('/generate-monthly-bills', async (req, res) => {
    const { month, year, amount } = req.body;
    try {
        const [users] = await db.query("SELECT id, flat_no FROM users WHERE role = 'resident'");
        const queries = users.map(user => 
            db.query(
                "INSERT INTO maintenance_payments (user_id, flat_no, month_name, year, amount, status) VALUES (?, ?, ?, ?, ?, 'Pending')",
                [user.id, user.flat_no, month, year, amount]
            )
        );
        await Promise.all(queries);
        res.status(200).send("Monthly bills generated!");
    } catch (err) {
        res.status(500).send("Error generating bills");
    }
});

module.exports = router;