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

// --- RESIDENT DASHBOARD STATS (LOGIC FIXED) ---
app.get('/api/resident/dashboard-stats/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [userRows] = await db.query("SELECT flat_no FROM users WHERE id = ?", [id]);
        
        // Sum only bills where resident hasn't submitted a Transaction ID yet
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

// --- RESIDENT PAYMENT UPDATES (All-in-One Fix) ---

// 1. Submit Payment (UPDATE instead of INSERT)
app.put('/api/resident/submit-payment', async (req, res) => {
    const { payment_id, transaction_id } = req.body; 
    if (!transaction_id || !payment_id) return res.status(400).json({ message: "Missing Data" });
    try {
        const query = `UPDATE payments SET transaction_id = ?, method = 'UPI', payment_date = NOW() WHERE id = ?`;
        await db.query(query, [transaction_id, payment_id]);
        res.status(200).json({ message: "Payment details submitted for verification!" });
    } catch (err) {
        res.status(500).json({ error: "Database update failed" });
    }
});

// 2. Unpaid Bills (For Resident Dropdown)
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

// 3. Resident History (Show Verified & Pending with TransID)
app.get('/api/resident/payment-history/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT * FROM payments 
            WHERE resident_id = ? 
            AND (status = 'Verified' OR transaction_id IS NOT NULL)
            ORDER BY payment_date DESC
        `;
        const [rows] = await db.query(query, [id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

// --- COMPLAINTS & NOTICES ---
app.post('/api/complaints', async (req, res) => {
    const { description, category, user_id } = req.body; 
    try {
        await db.query("INSERT INTO complaints (user_id, description, category, status) VALUES (?, ?, ?, 'Pending')", [user_id, description, category]); 
        res.status(201).json({ message: "✅ Submitted!" });
    } catch (err) {
        res.status(500).json({ message: "❌ DB error" });
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