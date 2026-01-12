import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../../api'; 
import './ResidentDashboard.css';

function ResidentDashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    
    const [dbStats, setDbStats] = useState({
        flat_no: user?.flat_no || "N/A",
        pendingDues: 0,
        openComplaints: 0,
        totalNotices: 0
    });

    // 1. Unpaid bills store karne ke liye state (Dues kam karne ke liye zaroori)
    const [unpaidBills, setUnpaidBills] = useState([]);

    useEffect(() => {
        if (user?.id) {
            fetchResidentStats();
            fetchUnpaidBills();
        }
    }, []);

    const fetchResidentStats = async () => {
        try {
            // ✅ Logic Fix: admin.js ka stats route call ho raha hai
            const res = await API.get(`/api/admin/resident-stats/${user.id}`);        
            setDbStats(res.data);
        } catch (err) {
            console.error("Error fetching resident stats:", err);
        }
    };

    const fetchUnpaidBills = async () => {
        try {
            // ✅ Logic Fix: Sirf wahi bills uthayega jinpe payment submit nahi hui hai
            const res = await API.get(`/api/resident/unpaid-bills/${user.id}`);
            setUnpaidBills(res.data);
        } catch (err) {
            console.error("Error fetching bills:", err);
        }
    };

    const stats = [
        { label: "My Flat", count: dbStats.flat_no, icon: "🏠" },
        { label: "Pending Dues", count: `₹${dbStats.pendingDues}`, icon: "💳" },
        { label: "Open Complaints", count: dbStats.openComplaints, icon: "🛠️" },
        { label: "New Notices", count: dbStats.totalNotices, icon: "📢" }
    ];

    return (
        <div className="resident-main-content">
            <header className="dashboard-header-inline">
                <h1>Resident Portal</h1>
                <p>Welcome back, <strong>{user?.name}</strong></p>
            </header>

            <div className="stats-container">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <span className="stat-icon">{stat.icon}</span>
                        <div className="stat-details">
                            {/* ✅ UI Fix: Pending dues agar > 0 hain toh red color mein dikhayega */}
                            <h3 style={stat.label === "Pending Dues" && dbStats.pendingDues > 0 ? {color: 'red'} : {}}>
                                {stat.count}
                            </h3>
                            <p>{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <section className="quick-actions-section">
                <h2>Resident Services</h2>
                <div className="action-grid">
                    <div className="action-box" onClick={() => navigate('/resident-dashboard/complaints')}>
                        <h4>File a Complaint</h4>
                        <p>Report maintenance or security issues in your wing.</p>
                    </div>
                    
                    {/* ✅ Logic Fix: Navigate to payments page where resident will UPDATE the bill, not insert new one */}
                    <div className="action-box" onClick={() => navigate('/resident-dashboard/payments')}>
                        <h4>Pay Maintenance</h4>
                        <p>Quickly clear your monthly society dues online.</p>
                        {unpaidBills.length > 0 && (
                            <span className="pending-badge">{unpaidBills.length} Bill(s) Unpaid</span>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default ResidentDashboard;