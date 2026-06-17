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
    if (!society_name || society_name.trim().length === 0) return res.status(400).json({ error: 'Society name is required.' });
    if (!maintenance_amount || isNaN(maintenance_amount) || Number(maintenance_amount) <= 0) return res.status(400).json({ error: 'Maintenance amount must be a positive number.' });
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
    const allowedCategories = ['Plumbing', 'Electricity', 'Security', 'Cleaning', 'Others'];
    if (!description || description.trim().length === 0) return res.status(400).json({ message: 'Description is required.' });
    if (!category || !allowedCategories.includes(category)) return res.status(400).json({ message: 'Invalid category.' });
    if (!user_id || isNaN(user_id)) return res.status(400).json({ message: 'Valid user ID is required.' });
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
    if (!title || title.trim().length === 0) return res.status(400).json({ error: 'Title is required.' });
    if (!description || description.trim().length === 0) return res.status(400).json({ error: 'Description is required.' });
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

// --- EXPENSE MANAGEMENT ROUTES ---
app.post('/api/admin/expenses', async (req, res) => {
    const { title, category, amount, description, spent_date } = req.body;
    if (!title || !category || !amount || !spent_date) return res.status(400).json({ error: 'Title, category, amount, and date are required.' });
    if (isNaN(amount) || Number(amount) <= 0) return res.status(400).json({ error: 'Amount must be a positive number.' });
    try {
        const query = `INSERT INTO expenses (title, category, amount, description, spent_date) VALUES (?, ?, ?, ?, ?)`;
        await db.query(query, [title, category, amount, description, spent_date]);
        res.status(200).json({ message: "Expense recorded successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Database error saving expense" });
    }
});

app.get('/api/admin/expenses', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM expenses ORDER BY spent_date DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch expenses" });
    }
});

app.get('/api/admin/financial-summary', async (req, res) => {
    try {
        const [income] = await db.query("SELECT SUM(amount) as total FROM payments WHERE status = 'Verified'");
        const [expense] = await db.query("SELECT SUM(amount) as total FROM expenses");
        res.json({
            totalIncome: income[0].total || 0,
            totalOutflow: expense[0].total || 0
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch financial data" });
    }
});

// --- RESIDENT DASHBOARD STATS (FIXED LOGIC) ---
app.get('/api/resident/dashboard-stats/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [userRows] = await db.query("SELECT flat_no FROM users WHERE id = ?", [id]);
        
        // Only sum bills where resident hasn't submitted a Transaction ID yet
        const [dueRows] = await db.query(
            "SELECT SUM(amount) as pending FROM payments WHERE resident_id = ? AND status = 'Pending' AND transaction_id IS NULL", 
            [id]
        );
        
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

// Resident Billing List
app.get('/api/resident/unpaid-bills/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(
            "SELECT id, amount, month_name, year FROM payments WHERE resident_id = ? AND status = 'Pending' AND transaction_id IS NULL", 
            [id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch bills" });
    }
});

// Resident submit payment
app.put('/api/resident/submit-payment', async (req, res) => {
    const { payment_id, transaction_id } = req.body;
    if (!payment_id || !transaction_id || transaction_id.trim().length === 0) {
        return res.status(400).json({ error: 'Payment ID and Transaction ID are required.' });
    }
    try {

        const query = `UPDATE payments SET transaction_id = ?, method = 'UPI', payment_date = NOW() WHERE id = ?`;
        await db.query(query, [transaction_id, payment_id]);
        res.status(200).json({ message: "✅ Payment Recorded! Admin will verify it soon." });
    } catch (err) {
        res.status(500).json({ error: "Update failed" });
    }
});


// Resident payment history
app.get('/api/resident/payment-history/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `SELECT * FROM payments WHERE resident_id = ? AND (status = 'Verified' OR transaction_id IS NOT NULL) ORDER BY payment_date DESC`;
        const [rows] = await db.query(query, [id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "History failed" });
    }
});

// --- ADMIN: RESIDENT DIRECTORY & DELETE (UPDATED) ---
app.get('/api/admin/residents', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id, name, email, phone, flat_no FROM users WHERE role = 'resident' ORDER BY flat_no ASC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/residents/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        //Remove all data related to the resident account
        await connection.query("DELETE FROM notifications WHERE sender_id = ?", [id]);
        await connection.query("DELETE FROM complaints WHERE user_id = ?", [id]);
        await connection.query("DELETE FROM payments WHERE resident_id = ?", [id]);

        // Delete the user record
        const [result] = await connection.query("DELETE FROM users WHERE id = ? AND role = 'resident'", [id]);
        
        if (result.affectedRows === 0) {
            throw new Error("Resident not found");
        }

        await connection.commit();
        res.json({ message: "✅ Resident and all their data deleted successfully!" });
    } catch (err) {
        await connection.rollback();
        console.error("Deletion error:", err.message);
        res.status(500).json({ error: "Failed to delete resident. Database rollback performed." });
    } finally { 
        connection.release(); 
    }
});

// --- PROFILE & NOTIFICATIONS ---
app.get('/api/auth/me/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query("SELECT id, name, email, role, flat_no FROM users WHERE id = ?", [id]);
        res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: "DB error" }); }
});


app.post('/api/notifications', async (req, res) => {
    const { sender_id, message, type } = req.body;
    try {
        await db.query(
            "INSERT INTO notifications (sender_id, message, type, created_at) VALUES (?, ?, ?, NOW())",
            [sender_id, message, type]
        );
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/notifications', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});


app.put('/api/resident/request-delete/:id', async (req, res) => {
    const { id } = req.params;
    try {

        res.status(200).json({ message: "Deletion request received by server" });
    } catch (err) {
        res.status(500).json({ error: "Failed to process request" });
    }
});

// --- ADMIN: DELETE ANOTHER ADMIN ---
// List all admin accounts
app.get('/api/admin/list-admins', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id, name, email FROM users WHERE role = 'admin'");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch admins" });
    }
});

// Delete admin account (with safety check)
app.delete('/api/admin/remove-admin/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Ensure at least one admin account remains
        const [adminCount] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
        if (adminCount[0].count <= 1) {
            return res.status(400).json({ error: "❌ Cannot delete the only admin account!" });
        }

        // Step 2: Delete
        await db.query("DELETE FROM users WHERE id = ? AND role = 'admin'", [id]);
        res.json({ message: "✅ Admin removed successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

// --- DB CONNECTION ---
db.getConnection()
    .then(connection => {
        console.log('✅ MySQL Database Connected');
        connection.release();
    })
    .catch(err => { console.error('❌ Failed:', err.message); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log(`🚀 Running on ${PORT}`); });