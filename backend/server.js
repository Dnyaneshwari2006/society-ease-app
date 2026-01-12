const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

const db = require('./config/db'); 
const authRoutes = require('./auth'); 
const adminRoutes = require('./admin');

const app = express();

// 1. Middleware
app.use(cors({
    origin: ["https://society-ease-app-k27x.onrender.com", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- CLOUDINARY CONFIGURATION ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'society_qrs',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});
const upload = multer({ storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. Initialize Auth & Admin Routes
const expressRouter = express.Router(); 
authRoutes(expressRouter, db); 
app.use('/api/auth', expressRouter);
app.use('/api/admin', adminRoutes);

// --- SOCIETY SETTINGS ROUTES ---
app.get('/api/society/settings', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM society_settings WHERE id = 1");
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch settings" });
    }
});

app.put('/api/admin/update-society-settings', async (req, res) => {
    const { society_name, maintenance_amount } = req.body;
    try {
        await db.query("UPDATE society_settings SET society_name = ?, maintenance_amount = ? WHERE id = 1", [society_name, maintenance_amount]);
        res.json({ message: "✅ Society details updated successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/api/admin/upload-qr', upload.single('qrCode'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        const qrUrl = req.file.path;
        await db.query("UPDATE society_settings SET qr_image = ? WHERE id = 1", [qrUrl]);
        res.json({ message: "✅ QR Updated successfully!", filename: qrUrl });
    } catch (err) {
        res.status(500).json({ error: "Upload failed" });
    }
});

// --- COMPLAINT ROUTES ---
app.post('/api/complaints', async (req, res) => {
    const { description, category, user_id } = req.body; 
    if (!description || !category) return res.status(400).json({ message: "Missing data" });
    try {
        await db.query("INSERT INTO complaints (user_id, description, category, status) VALUES (?, ?, ?, 'Pending')", [user_id, description, category]); 
        res.status(201).json({ message: "✅ Complaint submitted successfully!" });
    } catch (err) {
        res.status(500).json({ message: "❌ Database error" });
    }
});

app.get('/api/admin/complaints', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT complaints.*, users.name, users.flat_no 
            FROM complaints 
            JOIN users ON complaints.user_id = users.id
            ORDER BY complaints.created_at DESC
        `);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch complaints" });
    }
});

app.put('/api/complaints/:id/resolve', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE complaints SET status = 'Resolved' WHERE id = ?", [id]);
        res.status(200).json({ message: "Complaint marked as resolved" });
    } catch (err) {
        res.status(500).json({ error: "Update failed" });
    }
});

// --- NOTICE BOARD ROUTES ---
app.post('/api/admin/notices', async (req, res) => {
    const { title, description } = req.body;
    try {
        await db.query("INSERT INTO notices (title, description, created_at) VALUES (?, ?, NOW())", [title, description]);
        res.status(201).json({ message: "✅ Notice posted successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

app.get('/api/notices', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM notices ORDER BY created_at DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/notices/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query("DELETE FROM notices WHERE id = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Notice not found" });
        res.json({ message: "✅ Notice deleted successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

// --- ADMIN STATS ---
app.get('/api/admin/stats', async (req, res) => {
    try {
        const [residents] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'resident'");
        const [notices] = await db.query("SELECT COUNT(*) as count FROM notices");
        const [complaints] = await db.query("SELECT COUNT(*) as count FROM complaints WHERE status = 'Pending'");
        const [revenue] = await db.query("SELECT SUM(amount) as total FROM payments WHERE status = 'Verified'");

        res.json({
            totalResidents: residents[0].count,
            totalNotices: notices[0].count,
            pendingComplaints: complaints[0].count,
            monthlyRevenue: revenue[0].total || 0 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- RESIDENT DASHBOARD STATS (FIXED LOGIC) ---
app.get('/api/resident/dashboard-stats/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [userRows] = await db.query("SELECT flat_no FROM users WHERE id = ?", [id]);
        // ✅ Real-time calculation: Sum of all 'Pending' bills
        const [dueRows] = await db.query("SELECT SUM(amount) as pending FROM payments WHERE resident_id = ? AND status = 'Pending'", [id]);
        const [complaintRows] = await db.query("SELECT COUNT(*) as count FROM complaints WHERE user_id = ? AND status = 'Pending'", [id]);
        const [noticeRows] = await db.query("SELECT COUNT(*) as count FROM notices");

        res.json({
            flat_no: userRows[0]?.flat_no || 'N/A',
            pendingDues: dueRows[0].pending || 0,
            openComplaints: complaintRows[0].count || 0,
            totalNotices: noticeRows[0].count || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- RESIDENT PAYMENT ---
app.post('/api/resident/pay', async (req, res) => {
    const { resident_id, amount, transaction_id, month_year, method } = req.body;
    if (!transaction_id || !resident_id) return res.status(400).json({ message: "Transaction ID is required!" });
    try {
        const query = `INSERT INTO payments (resident_id, amount, transaction_id, month_year, method, status, payment_date) VALUES (?, ?, ?, ?, ?, 'Pending', NOW())`;
        await db.query(query, [resident_id, amount, transaction_id, month_year, method]);
        res.status(201).json({ message: "Payment recorded successfully" });
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

// --- ADMIN: RESIDENT DIRECTORY ---
app.get('/api/admin/residents', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id, name, email, phone, flat_no FROM users WHERE role = 'resident' ORDER BY flat_no ASC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN: DELETE RESIDENT (WITH TRANSACTION) ---
app.delete('/api/admin/residents/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query("DELETE FROM notifications WHERE sender_id = ?", [id]);
        await connection.query("DELETE FROM complaints WHERE user_id = ?", [id]);
        await connection.query("DELETE FROM payments WHERE resident_id = ?", [id]);
        const [result] = await connection.query("DELETE FROM users WHERE id = ? AND role = 'resident'", [id]);
        
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Resident not found" });
        }
        await connection.commit();
        res.json({ message: "✅ Resident and all related data cleared!"});
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// --- ACCOUNT DELETION REQUESTS ---
app.put('/api/resident/request-delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE users SET delete_request = 1 WHERE id = ?", [id]);
        res.json({ message: "Deletion request sent to Admin! 📩" });
    } catch (err) {
        res.status(500).json({ error: "Failed to send request" });
    }
});

app.get('/api/admin/delete-requests-count', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT COUNT(*) as count FROM users WHERE delete_request = 1");
        res.json({ count: rows[0].count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PROFILE & NOTIFICATIONS ---
app.get('/api/auth/me/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query("SELECT id, name, email, role, flat_no FROM users WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ error: "User not found" });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

app.post('/api/notifications', async (req, res) => {
    const { sender_id, message, type } = req.body;
    try {
        await db.query("INSERT INTO notifications (sender_id, message, type, created_at) VALUES (?, ?, ?, NOW())", [sender_id, message, type]);
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- EXPENSE MANAGEMENT ---
app.post('/api/admin/expenses', async (req, res) => {
    const { title, category, amount, description, spent_date } = req.body;
    try {
        const query = `INSERT INTO expenses (title, category, amount, description, spent_date) VALUES (?, ?, ?, ?, ?)`;
        await db.query(query, [title, category, amount, description, spent_date]);
        res.status(200).json({ message: "✅ Expense saved successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.sqlMessage || "Internal Server Error" });
    }
});

app.get('/api/admin/expenses', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM expenses ORDER BY spent_date DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to load expenses" });
    }
});

// --- FINANCIAL SUMMARY & CHARTS ---
app.get('/api/admin/financial-summary', async (req, res) => {
    try {
        const [incomeRows] = await db.query("SELECT SUM(amount) as total_income FROM payments WHERE status = 'Verified'");
        const [expenseRows] = await db.query("SELECT SUM(amount) as total_outflow FROM expenses");
        const [recentExpenses] = await db.query("SELECT spent_date as date, category, title, amount FROM expenses ORDER BY spent_date DESC LIMIT 5");

        res.json({
            totalIncome: incomeRows[0].total_income || 0,
            totalOutflow: expenseRows[0].total_outflow || 0,
            expenses: recentExpenses
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch financial data" });
    }
});

app.put('/api/resident/submit-payment', async (req, res) => {
    const { payment_id, transaction_id } = req.body; 
    try {
        // Purane record mein Transaction ID bhar do, naya record mat banao
        const query = `UPDATE payments SET transaction_id = ?, method = 'UPI', payment_date = NOW() WHERE id = ?`;
        await db.query(query, [transaction_id, payment_id]);
        res.status(200).json({ message: "Payment info updated!" });
    } catch (err) {
        res.status(500).json({ error: "Update failed" });
    }
});


// --- DB CONNECTION & START ---
db.getConnection()
    .then(connection => {
        console.log('✅ MySQL Database Connected Successfully');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});