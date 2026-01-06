import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../../api'; // Ensure path is correct
import './ResidentDashboard.css';

function ResidentDashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    
    // 1. Database stats ke liye state banayein
    const [dbStats, setDbStats] = useState({
        flat_no: user?.flat_no || "N/A",
        pendingDues: 0,
        openComplaints: 0,
        totalNotices: 0
    });

    // 2. Real-time data fetch karein
    useEffect(() => {
        const fetchResidentStats = async () => {
            try {
                if (user?.id) {
                    const res = await API.get(`/api/resident/dashboard-stats/${user.id}`);
                    setDbStats(res.data);
                }
            } catch (err) {
                console.error("Error fetching resident stats:", err);
            }
        };
        fetchResidentStats();
    }, []);

    // 3. Stats array ko state se connect karein
    const stats = [
        { label: "My Flat", count: dbStats.flat_no, icon: "🏠" },
        { label: "Pending Dues", count: `₹${dbStats.pendingDues.toLocaleString()}`, icon: "💳" },
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
                    <div className="action-box" onClick={() => navigate('/resident-dashboard/payments')}>
                        <h4>Pay Maintenance</h4>
                        <p>Quickly clear your monthly society dues online.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default ResidentDashboard;