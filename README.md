# 🏢 SocietyEase - Modern Society Management System

[![Vite](https://img.shields.io/badge/Vite-5.0.0-646CFF?style=flat&logo=vite&logoColor=white)](https://vite.dev)
[![React](https://img.shields.io/badge/React-18.2.0-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![MySQL](https://img.shields.io/badge/MySQL-28303-4479A1?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-QR--Codes-F05023?style=flat&logo=cloudinary&logoColor=white)](https://cloudinary.com)
[![Resend](https://img.shields.io/badge/Resend-Emails-000000?style=flat&logo=resend&logoColor=white)](https://resend.com)

**SocietyEase** is a comprehensive, full-stack society management application designed to streamline administration, tracking, and communication inside residential housing societies. Built with a robust **Node.js/Express & MySQL** backend and a responsive **React (Vite)** frontend, it provides specialized interfaces for both **Admins** and **Residents**.

---

## 🚀 Key Features

### 👑 Admin Control Panel
*   **👥 Resident Directory:** Register, view, and safely remove resident accounts (performs cascading delete for all related resident history/data).
*   **💵 Bill Generator:** Automatically generate bulk monthly maintenance bills for all registered residents with a single click. Prevents accidental duplicate generations for the same month.
*   **📊 Financial Summary:** Full-featured income vs. outflow tracking. Record expenditures (expense manager) and visualize financial health using interactive charts.
*   **💳 UPI Payment Verification:** View payment requests submitted by residents (containing transaction IDs), verify transaction proofs, and update payment statuses.
*   **📢 Notice Board Manager:** Publish important announcements or delete outdated circulars to maintain clean and current community notices.
*   **🛠️ Society Settings:** Customize the society name, update standard maintenance amounts, and upload a custom UPI QR code to **Cloudinary** for payments.

### 🏡 Resident Dashboard
*   **📈 Real-time Overview:** Instant visual stats showing total pending dues, open complaints, and newly posted community notices.
*   **💳 UPI Payment Portal:** Scan the society's dynamically loaded UPI QR code, pay dues instantly, and submit the Transaction ID for verification.
*   **📜 Billing & Payment History:** Track the status of all current and historical bills (e.g., Pending, Verified) with clean tabular lists.
*   **🚨 Complaint Lodging:** File complaints under specific categories (e.g., Plumbing, Security, Electrical) and monitor resolution status.
*   **📋 Digital Notice Board:** Real-time chronological board showcasing important notifications posted by the society administration.
*   **👤 Profile Management:** View personal flat directory info, reset passwords securely, or request account deletions.

---

## 🛠️ Technology Stack

### Frontend (Client)
*   **React (v18)** powered by **Vite** for blazing fast HMR and optimized builds.
*   **React Router Dom (v7)** for client-side nested routing and page layouts.
*   **Chart.js** & **React-Chartjs-2** for real-time finance and expense analysis graphs.
*   **jsPDF** & **jsPDF-AutoTable** for generating download-ready PDF reports.
*   **React Icons** for clean, scalable vector iconography.
*   **Vanilla CSS3** for premium, modern, and fluid user interface styling.

### Backend (Server)
*   **Express.js** for building clean, high-performance REST APIs.
*   **MySQL (mysql2)** utilizing connection pooling, optimized with SSL settings specifically suited for cloud providers like **Aiven MySQL**.
*   **JSON Web Tokens (JWT)** & **Bcrypt.js** for secure session authentication.
*   **Multer** & **Cloudinary** integrations for automated, secure media uploads.
*   **Resend API** to programmatically deliver transactional security emails (e.g., password reset links).

---

## 📁 Directory Structure

```text
society-ease-app/
├── backend/
│   ├── config/
│   │   └── db.js                  # MySQL Database connection pool (Aiven Cloud ready)
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT Session verification middleware
│   ├── uploads/                   # Local file buffer directories
│   ├── admin.js                   # Administrative business logic & routes
│   ├── auth.js                    # Auth endpoints (Register, Login, Password Reset)
│   ├── server.js                  # Main server entry & route initializations
│   ├── schema.sql                 # Ready-to-import MySQL database setup script
│   ├── .env.example               # Template for environment configurations
│   └── package.json
└── client/
    ├── src/
    │   ├── components/            # Reusable core elements (e.g., ProtectedRoute)
    │   ├── services/
    │   │   ├── pages/             # Layouts, Stylesheets & Feature Pages
    │   │   │   ├── AdminDashboard/
    │   │   │   ├── Login/
    │   │   │   ├── Register/
    │   │   │   └── ResidentDashboard/
    │   │   │   App.jsx            # Main app router definition
    │   │   └── api.js             # Central Axios instance with API configurations
    │   ├── App.css
    │   └── main.jsx               # Client initialization script
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## ⚙️ Setup and Installation

### 1. Database Setup
Ensure you have a **MySQL** server running locally or hosted on a cloud service (e.g., Aiven, PlanetScale).
1. Create a new MySQL database:
   ```sql
   CREATE DATABASE society_ease;
   ```
2. Import the provided schema in `backend/schema.sql`:
   ```bash
   mysql -u your_username -p society_ease < backend/schema.sql
   ```

### 2. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the provided `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Update the values in `.env` with your database credentials, Cloudinary access tokens, and Resend API key.

5. Start the backend server:
   ```bash
   node server.js
   ```
   The backend should now be running on `http://localhost:5000` (or your configured `PORT`).

### 3. Client Setup
1. Navigate to the `client` folder:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## 📦 Production Build and Compilation

To verify, package, and optimize the React client for production, run:
```bash
cd client
npm run build
```
This compiles your entire frontend assets, assets are optimized, tree-shaken, and bundled into a highly efficient `/dist` folder ready to be deployed to static hosting providers (Netlify, Vercel, Hostinger, etc.).

---

## 🔒 Security Practices
*   **Encrypted Secrets:** All database passwords, Resend keys, and Cloudinary APIs are loaded via environment variables rather than hardcoded in files.
*   **Password Hashing:** Uses `bcryptjs` with salt round `10` to safely hash all resident and admin credentials.
*   **Session Token Protection:** Standardized `jsonwebtoken (JWT)` authentication ensures routes like complaints, setting modifications, and billing remain private and protected from unauthorized requests.
