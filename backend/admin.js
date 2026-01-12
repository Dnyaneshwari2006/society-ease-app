// --- ADMIN PAYMENT MANAGEMENT ---

const express = require('express');
const router = express.Router();
const db = require('./config/db'); // ✅ Correct path

// A. Get all payments for Admin Tracker
router.get('/payments', async (req, res) => {
    try {
        const query = `
            SELECT p.*, u.username AS user_name, u.flat_no 
            FROM payments p
            JOIN users u ON p.resident_id = u.id
            ORDER BY p.id DESC
        `;
        // Order by ID DESC rakho taaki naye records (ID 20-25) sabse upar dikhein
        const [rows] = await db.query(query);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to load" });
    }
});

// B. Verify specific payment 
router.put('/verify-payment/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; 

    try {
        // Manual verification: Only update the specific row clicked by admin
        const query = "UPDATE payments SET status = ? WHERE id = ?";
        const [result] = await db.query(query, [status, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Payment not found" });
        }
        res.status(200).json({ message: "Payment Verified Successfully!", status });
    } catch (err) {
        console.error("Verify Error:", err);
        res.status(500).json({ error: "Database error during verification" });
    }
});

module.exports = router; // ✅ Zaruri export

// C. Generate Monthly Maintenance Bills for all Residents
router.post('/generate-bills', async (req, res) => {
    const { amount, month, year } = req.body;
    try {
        const [residents] = await db.query("SELECT id FROM users WHERE role = 'resident'");
        
        const queries = residents.map(r => 
            db.query(
                // ✅ Sahi columns use karein: month_name aur year
                "INSERT INTO payments (resident_id, amount, status, method, month_name, year, payment_date) VALUES (?, ?, 'Pending', 'Cash', ?, ?, NOW())", 
                [r.id, amount, month, year]
            )
        );
        await Promise.all(queries);
        res.json({ message: "Bills generated successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// D. Get Resident Stats (Pending Dues)
router.get('/resident-stats/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // 1. Pending Dues Sum
        const [dues] = await db.query(
            "SELECT SUM(amount) AS total FROM payments WHERE resident_id = ? AND status = 'Pending'", 
            [userId]
        );

        // 2. Open Complaints
        const [complaints] = await db.query(
            "SELECT COUNT(*) AS total FROM complaints WHERE user_id = ? AND status != 'Resolved'", 
            [userId]
        );

        // 3. Notices Count
        const [notices] = await db.query("SELECT COUNT(*) AS total FROM notices");

        // 4. User Details (Flat No)
        const [user] = await db.query("SELECT flat_no FROM users WHERE id = ?", [userId]);

        // ✅ FIXED: Added missing ) and ;
        res.json({
            flat_no: user[0]?.flat_no || "N/A",
            pendingDues: dues[0]?.total || 0,
            openComplaints: complaints[0]?.total || 0,
            totalNotices: notices[0]?.total || 0
        });

    } catch (err) { // ✅ FIXED: Added missing } before catch
        console.error("❌ Stats Error:", err);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});