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
// server.js mein cors ko aise update karein
app.use(cors({
    origin: ["https://society-ease-app-k27x.onrender.com", "http://localhost:5173"], // Frontend URL aur Localhost dono allow karein
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

// 2. ✅ Initialize Auth Routes (Correct Prefix)
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
        const query = "UPDATE society_settings SET society_name = ?, maintenance_amount = ? WHERE id = 1";
        await db.query(query, [society_name, maintenance_amount]);
        res.json({ message: "✅ Society details updated successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Cloudinary Upload Route for QR
app.post('/api/admin/upload-qr', upload.single('qrCode'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        const qrUrl = req.file.path; // Cloudinary URL (https://res.cloudinary.com/...)
        await db.query("UPDATE society_settings SET qr_image = ? WHERE id = 1", [qrUrl]);
        res.json({ message: "✅ QR Updated successfully!", filename: qrUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Upload failed" });
    }
});

// --- COMPLAINT ROUTES ---
app.post('/api/complaints', async (req, res) => {
    const { description, category, user_id } = req.body; 
    if (!description || !category) {
        return res.status(400).json({ message: "Missing data" });
    }
    try {
        await db.query(
            "INSERT INTO complaints (user_id, description, category, status) VALUES (?, ?, ?, 'Pending')",
            [user_id, description, category]
        ); 
        res.status(201).json({ message: "✅ Complaint submitted successfully!" });
    } catch (err) {
        console.error("Database Error:", err);
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
        // Aapke table mein column 'description' hai, 'message' nahi
        const [result] = await db.query(
            "INSERT INTO notices (title, description, created_at) VALUES (?, ?, NOW())", 
            [title, description]
        );
        res.status(201).json({ message: "✅ Notice posted successfully!" });
    } catch (err) {
        // Precise error logging terminal mein
        console.error("❌ SQL Error:", err.message);
        res.status(500).json({ error: "Database error: " + err.message });
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

// --- ADMIN: DELETE A NOTICE ---
// server.js mein check karein
app.delete('/api/admin/notices/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // 'notices' table ka naam wahi hona chahiye jo aapne SQL mein banaya hai
        const [result] = await db.query("DELETE FROM notices WHERE id = ?", [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Notice not found" });
        }
        
        res.json({ message: "✅ Notice deleted successfully!" });
    } catch (err) {
        console.error("❌ SQL Delete Error:", err.message);
        res.status(500).json({ error: "Database error" });
    }
});


// --- ADMIN STATS --- //Real time no. of residents display kartay//
app.get('/api/admin/stats', async (req, res) => {
    try {
        const [residents] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'resident'");
        const [notices] = await db.query("SELECT COUNT(*) as count FROM notices");
        const [complaints] = await db.query("SELECT COUNT(*) as count FROM complaints WHERE status = 'Pending'");
        
        // ✅ Aapke table mein status 'Verified' hai
        // Hum amount ka total sum nikaal rahe hain
        const [revenue] = await db.query(
            "SELECT SUM(amount) as total FROM payments WHERE status = 'Verified'"
        );

        res.json({
            totalResidents: residents[0].count,
            totalNotices: notices[0].count,
            pendingComplaints: complaints[0].count,
            // Agar koi verified payment nahi hai toh 0 bhejhein
            monthlyRevenue: revenue[0].total || 0 
        });
    } catch (err) {
        console.error("❌ Stats Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});


//Resident Stats dashboard sathi
app.get('/api/resident/dashboard-stats/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Society Settings: Aapke table mein column 'maintenance_amount' hai
        const [settings] = await db.query("SELECT maintenance_amount FROM society_settings LIMIT 1");
        const CURRENT_FEE = settings[0]?.maintenance_amount || 1000;

        // 2. User Flat No
        const [userRows] = await db.query("SELECT flat_no FROM users WHERE id = ?", [id]);
        
        // 3. Resident Payments: 'resident_id' use karein
        const [paymentRows] = await db.query(
            "SELECT SUM(amount) as paid FROM payments WHERE resident_id = ? AND status = 'Verified'", 
            [id]
        );
        const paidAmount = paymentRows[0].paid || 0;
        const finalDues = CURRENT_FEE - paidAmount;

        // 4. Complaints: Yahan 'user_id' check karein
        const [complaintRows] = await db.query(
            "SELECT COUNT(*) as count FROM complaints WHERE user_id = ? AND status = 'Pending'", 
            [id]
        );

        // 5. Total Notices: Aapke database mein 3 entries hain
        const [noticeRows] = await db.query("SELECT COUNT(*) as count FROM notices");

        res.json({
            flat_no: userRows[0]?.flat_no || 'N/A',
            pendingDues: finalDues > 0 ? finalDues : 0,
            openComplaints: complaintRows[0].count || 0,
            totalNotices: noticeRows[0].count || 0
        });

    } catch (err) {
        console.error("❌ Stats Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});


// --- RESIDENT PAYMENT --- //Resident payment record karnyasathi//
app.post('/api/resident/pay', async (req, res) => {
    const { resident_id, amount, transaction_id, month_year, method } = req.body;
    if (!transaction_id || !resident_id) {
        return res.status(400).json({ message: "Transaction ID is required!" });
    }
    try {
        const query = `
            INSERT INTO payments (resident_id, amount, transaction_id, month_year, method, status, payment_date) 
            VALUES (?, ?, ?, ?, ?, 'Pending', NOW())
        `;
        await db.query(query, [resident_id, amount, transaction_id, month_year, method]);
        res.status(201).json({ message: "Payment recorded successfully" });
    } catch (err) {
        res.status(500).json({ error: "Database error: Could not record payment" });
    }
});


// --- ADMIN PAYMENT MANAGEMENT ---
// 1. GET: Fetch Payments
app.get('/api/admin/payments', async (req, res) => {
    try {
        const query = `
            SELECT 
                mp.*, 
                u.username AS user_name, 
                u.flat_no 
            FROM maintenance_payments mp
            JOIN users u ON mp.user_id = u.id
            ORDER BY mp.payment_date DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows); 
    } catch (err) {
        console.error("❌ Fetch Error:", err);
        res.status(500).json({ error: "Failed to load payments" });
    }
});

// 2. PUT: Verify Payment
app.put('/api/admin/verify-payment/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; 

    try {
        const query = "UPDATE maintenance_payments SET status = ? WHERE id = ?";
        const [result] = await db.query(query, [status, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Record not found" });
        }
        res.status(200).json({ message: "Success", status: status });
    } catch (err) {
        console.error("❌ DB Error:", err);
        res.status(500).json({ error: "Database error" });
    }
});


// --- GET RESIDENT HISTORY ---
app.get('/api/admin/residents', async (req, res) => {
    try {
        // ✅ Ensure karein ki 'flat_no' column select ho raha hai
        const [rows] = await db.query(
            "SELECT id, name, email, flat_no FROM users WHERE role = 'resident' ORDER BY name ASC"
        );
        
        console.log("📊 Sending Residents to Admin:", rows); // Terminal mein check karein
        res.json(rows);
    } catch (err) {
        console.error("❌ Backend Error:", err.message);
        res.status(500).json({ error: "Failed to fetch residents" });
    }
});


// --- RESIDENT: FETCH PERSONAL PAYMENT HISTORY ---
app.get('/api/resident/payment-history/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Hum 'resident_id' ke base par filter kar rahe hain taki sirf us resident ka data aaye
        const [rows] = await db.query(
            "SELECT * FROM payments WHERE resident_id = ? ORDER BY payment_date DESC", 
            [id]
        );
        
        // Agar koi record nahi milta toh khali array bhejein
        res.json(rows); 
    } catch (err) {
        console.error("❌ History Fetch Error:", err.message);
        res.status(500).json({ error: "Failed to fetch payment history" });
    }
});


// --- EXPENSE MANAGEMENT ---   //Expenses save karnyasathi//
// 1. Add a new expense (Matches your table columns)
app.post('/api/admin/expenses', async (req, res) => {
    console.log("Incoming Expense Data:", req.body);

    const { title, category, amount, description, spent_date } = req.body;

    try {
        // 2. Ensure query matches your table screenshot EXACTLY
        const query = `
            INSERT INTO expenses (title, category, amount, description, spent_date) 
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.query(query, [title, category, amount, description, spent_date]);
        
        res.status(200).json({ message: "✅ Expense saved successfully!", id: result.insertId });
    } catch (err) {
        // 3. This will print the EXACT MySQL error in your terminal
        console.error("MYSQL ERROR:", err.sqlMessage || err);
        res.status(500).json({ error: err.sqlMessage || "Internal Server Error" });
    }
});

// 2. Fetch all expenses for the Admin Table
app.get('/api/admin/expenses', async (req, res) => {
    try {
        // Fetching all columns shown in your screenshot
        const [rows] = await db.query("SELECT * FROM expenses ORDER BY spent_date DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to load expenses" });
    }
});

//EXPENSE CHART DATA
// --- ADMIN: FINANCIAL SUMMARY FOR CHARTS ---
app.get('/api/admin/financial-summary', async (req, res) => {
    try {
        // 1. Calculate Total Income (Only Verified Payments)
        const [incomeRows] = await db.query(
            "SELECT SUM(amount) as total_income FROM payments WHERE status = 'Verified'"
        );

        // 2. Calculate Total Expenses
        const [expenseRows] = await db.query(
            "SELECT SUM(amount) as total_outflow FROM expenses"
        );

        // 3. Get recent expenses for your table
        const [recentExpenses] = await db.query(
            "SELECT spent_date as date, category, title, amount FROM expenses ORDER BY spent_date DESC LIMIT 5"
        );

        res.json({
            totalIncome: incomeRows[0].total_income || 0,
            totalOutflow: expenseRows[0].total_outflow || 0,
            expenses: recentExpenses
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch financial data" });
    }
});

//Chart madhe data display karnyasathi/
app.get('/api/admin/chart-data', async (req, res) => {
    try {
        // 1. Get Monthly Income (Verified only)
        const [income] = await db.query(`
            SELECT month_year as month, SUM(amount) as total 
            FROM payments WHERE status = 'Verified' 
            GROUP BY month_year LIMIT 6
        `);

        // 2. Get Monthly Expenses
        const [expenses] = await db.query(`
            SELECT DATE_FORMAT(spent_date, '%M %Y') as month, SUM(amount) as total 
            FROM expenses 
            GROUP BY month LIMIT 6
        `);

        res.json({ income, expenses });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- ADMIN: FETCH RESIDENT DIRECTORY ---
app.get('/api/admin/residents', async (req, res) => {
    try {
        // created_at ko query se hata diya hai
        const [rows] = await db.query(
            "SELECT id, name, email, phone, room_no FROM users WHERE role = 'resident' ORDER BY room_no ASC"
        );
        res.json(rows);
    } catch (err) {
        console.error("❌ SQL ERROR:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN: DELETE RESIDENT ---
// --- ADMIN: DELETE RESIDENT (FIXED WITH TRANSACTION) ---
app.delete('/api/admin/residents/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection(); // Connection check
    
    try {
        await connection.beginTransaction(); // Transaction shuru

        // 1. Pehle linked tables se data delete karein (Child records)
        await connection.query("DELETE FROM notifications WHERE sender_id = ?", [id]);
        await connection.query("DELETE FROM complaints WHERE user_id = ?", [id]);
        await connection.query("DELETE FROM payments WHERE resident_id = ?", [id]);

        // 2. Ab parent user delete karein
        const [result] = await connection.query("DELETE FROM users WHERE id = ? AND role = 'resident'", [id]);
        
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Resident not found" });
        }

        await connection.commit(); // Sab sahi raha toh save karein
        res.json({ message: "✅ Resident and all related data cleared!"});
    } catch (err) {
        await connection.rollback(); // Error aane par purana data restore karein
        console.error("❌ SQL Error:", err.message);
        res.status(500).json({ error: "Database error: " + err.message });
    } finally {
        connection.release();
    }
});


// --- ACCOUNT DELETION REQUESTS ---//
// 1. Resident request bhejta hai (ISSE RAKHEIN)
app.put('/api/resident/request-delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE users SET delete_request = 1 WHERE id = ?", [id]);
        res.json({ message: "Deletion request sent to Admin! 📩" });
    } catch (err) {
        res.status(500).json({ error: "Failed" });
    }
});

// 2. Admin ko count dikhata hai (ISSE ADD KAREIN - Ye error fix karega)
app.get('/api/admin/delete-requests-count', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT COUNT(*) as count FROM users WHERE delete_request = 1");
        res.json({ count: rows[0].count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Admin final delete karta hai
// --- RESIDENT: REQUEST ACCOUNT DELETION ---
app.put('/api/resident/request-delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = "UPDATE users SET delete_request = 1 WHERE id = ?";
        await db.query(query, [id]);
        res.json({ message: "Deletion request sent to Admin! 📩" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to send request" });
    }
});


//For Getting user details in real time for Profile.jsx
app.get('/api/auth/me/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Aapke table mein data 'flat_no' column mein hai
        const [rows] = await db.query(
            "SELECT id, name, email, role, flat_no FROM users WHERE id = ?", 
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("❌ SQL Error:", err.message);
        res.status(500).json({ error: "Database error" });
    }
});


// 1. Notification save karne ka route
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


// --- ADMIN: DELETE ANOTHER ADMIN ---
// 1. Sare Admins ki list fetch karne ke liye
app.get('/api/admin/list-admins', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id, name, email FROM users WHERE role = 'admin'");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch admins" });
    }
});

// 2. Admin delete karne ke liye (With Safety Check)
app.delete('/api/admin/remove-admin/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Step 1: Check karein ki kam se kam ek admin bachna chahiye
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


// 3. Database Connection Test
db.getConnection()
    .then(connection => {
        console.log('✅ MySQL Database Connected Successfully');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });

app.use((err, req, res, next) => {
    console.error("🔥 Global Error:", err.stack);
    res.status(500).json({ error: "Something went wrong on the server!" });
});

// 4. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});