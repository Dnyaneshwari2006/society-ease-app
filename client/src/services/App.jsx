import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet, useNavigate } from 'react-router-dom';
import { HiMenu, HiX } from 'react-icons/hi'; // Import hamburger icons
import API from '../api'; 
import '../App.css';

// All your imports remain the same
import AdminDashboard from './pages/AdminDashboard/AdminDasboard';
import PaymentTracker from './pages/AdminDashboard/PaymentTracker';
import AdminComplaints from './pages/AdminDashboard/AdminComplaints';
import AddResident from './pages/AdminDashboard/AddResident';
import ManageNotices from './pages/AdminDashboard/ManageNotices';
import ResidentLogs from './pages/AdminDashboard/ResidentLogs';
import SocietySettings from './pages/AdminDashboard/SocietySettings';
import ExpenseManager from './pages/AdminDashboard/ExpenseManager';
import ExpenseChart from './pages/AdminDashboard/ExpenseChart';

import ResidentDashboard from './pages/ResidentDashboard/ResidentDashboard';
import Profile from './pages/ResidentDashboard/Profile';
import NoticeBoard from './pages/ResidentDashboard/NoticeBoard';
import ComplaintForm from './pages/ResidentDashboard/ComplaintForm';
import PaymentPortal from './pages/ResidentDashboard/PaymentPortal';
import ResidentHistory from './pages/ResidentDashboard/ResidentPaymentHistory';

import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ResetPassword from './pages/Login/ResetPassword'; 
import ProtectedRoute from '../components/ProtectedRoute'; 

// --- DASHBOARD LAYOUT WITH RESPONSIVE SIDEBAR ---
function DashboardLayout({ role }) {
    const navigate = useNavigate();
    const [notifCount, setNotifCount] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar state for mobile

    // Notification Fetch Logic
    useEffect(() => {
        if (role === 'admin') {
            const fetchNotifs = () => {
                API.get('/api/admin/delete-requests-count')
                    .then(res => setNotifCount(res.data.count))
                    .catch(err => console.error("Notif fetch failed", err));
            };

            fetchNotifs();
            const interval = setInterval(fetchNotifs, 30000);
            return () => clearInterval(interval);
        }
    }, [role]);

    // Toggle sidebar
    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Close sidebar when clicking a nav link (mobile only)
    const handleNavClick = (path) => {
        navigate(path);
        setSidebarOpen(false); // Auto-close on mobile
    };
    
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="dashboard-wrapper">
            {/* Hamburger Menu Button (Mobile Only) */}
            <button 
                className="hamburger-btn" 
                onClick={toggleSidebar}
                aria-label="Toggle menu"
            >
                {sidebarOpen ? <HiX size={24} /> : <HiMenu size={24} />}
            </button>

            {/* Overlay (Mobile Only) */}
            {sidebarOpen && (
                <div 
                    className="sidebar-overlay" 
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar with dynamic class */}
            <nav className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
                <div className="sidebar-header">
                    <h2>SocietyEase</h2>
                    <span>{role === 'admin' ? 'Admin Panel' : 'Resident Portal'}</span>
                </div>
                
                <div className="nav-links">
                    {role === 'admin' ? (
                        <>
                            <button onClick={() => handleNavClick('/admin')}>📊 Home</button>
                            <button onClick={() => handleNavClick('/admin/payments')}>💰 Payments</button>
                            <button onClick={() => handleNavClick('/admin/complaints')}>📩 Complaints</button>
                            <button onClick={() => handleNavClick('/admin/add-resident')}>👥 Add Resident</button>
                            <button onClick={() => handleNavClick('/admin/notices')}>📢 Manage Notices</button>
                            
                            <button onClick={() => handleNavClick('/admin/residents')} className="notif-btn-wrapper">
                                📋 Resident Logs
                                {notifCount > 0 && <span className="sidebar-notif-badge">{notifCount}</span>}
                            </button>

                            <button onClick={() => handleNavClick('/admin/settings')}>⚙️ Society Settings</button>
                            <button onClick={() => handleNavClick('/admin/expenses')}>💸 Expenses</button>
                            <button onClick={() => handleNavClick('/admin/expense-chart')}>📈 Charts</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => handleNavClick('/resident-dashboard')}>📊 Home</button>
                            <button onClick={() => handleNavClick('/resident-dashboard/notices')}>📢 Notices</button>
                            <button onClick={() => handleNavClick('/resident-dashboard/complaints')}>🛠️ Complaints</button>
                            <button onClick={() => handleNavClick('/resident-dashboard/payments')}>💳 Payments</button>
                            <button onClick={() => handleNavClick('/resident-dashboard/history')}>📜 Payment History</button>
                            <button onClick={() => handleNavClick('/resident-dashboard/profile')}>👤 Profile</button>
                        </>
                    )}
                </div>

                <button onClick={handleLogout} className="logout-btn">Logout</button>
            </nav>

            <main className="content-area">
                <div className="glass-panel">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

// Home component remains the same
function Home() {
    return (
        <div className="home-hero-section">
            <div className="glass-container">
                <div className="hero-content">
                    <h1 className="main-logo">Society<span>Ease</span></h1>
                    <p className="hero-description">
                        Revolutionizing community living. Manage payments, resolve complaints, 
                        and stay updated with your society—all from one secure portal.
                    </p>
                    
                    <div className="home-features-pill">
                        <span>🚀 Fast Payments</span>
                        <div className="pill-dot"></div>
                        <span>📢 Instant Notices</span>
                        <div className="pill-dot"></div>
                        <span>🛠️ Easy Support</span>
                    </div>

                    <div className="hero-btn-group">
                        <Link to="/login" className="hero-btn btn-primary">
                            Access Portal
                        </Link>
                        <Link to="/register" className="hero-btn btn-outline">
                            Register Flat
                        </Link>
                    </div>
                </div>
            </div>
            <div className="bg-circle circle-1"></div>
            <div className="bg-circle circle-2"></div>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                <Route path="/admin" element={
                    <ProtectedRoute roleRequired="admin">
                        <DashboardLayout role="admin" />
                    </ProtectedRoute>
                }>
                    <Route index element={<AdminDashboard />} />
                    <Route path="notices" element={<ManageNotices />} />
                    <Route path="complaints" element={<AdminComplaints />} />
                    <Route path="payments" element={<PaymentTracker />} />
                    <Route path="add-resident" element={<AddResident />} />
                    <Route path="settings" element={<SocietySettings />} />
                    <Route path="residents" element={<ResidentLogs />} />
                    <Route path="expenses" element={<ExpenseManager />} />
                    <Route path="expense-chart" element={<ExpenseChart />} />
                </Route>

                <Route path="/resident-dashboard" element={
                    <ProtectedRoute roleRequired="resident">
                        <DashboardLayout role="resident" />
                    </ProtectedRoute>
                }>
                    <Route index element={<ResidentDashboard />} /> 
                    <Route path="notices" element={<NoticeBoard />} />
                    <Route path="complaints" element={<ComplaintForm />} />
                    <Route path="payments" element={<PaymentPortal />} />
                    <Route path="history" element={<ResidentHistory />} />
                    <Route path="profile" element={<Profile />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;