import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../../api'; 
import './AdminDashboard.css';

function AdminDashboard() {
    const navigate = useNavigate();
    
    const [stats, setStats] = useState({
        totalResidents: 0,
        pendingComplaints: 0,
        totalNotices: 0,
        monthlyRevenue: 0 
    });

    const [notifications, setNotifications] = useState([]);
    const [hasDeleteRequest, setHasDeleteRequest] = useState(false);

    const fetchDashboardData = useCallback(async () => {
        try {
            // Fetch stats
            const resStats = await API.get('/api/admin/stats');
            setStats({
                totalResidents: resStats.data.totalResidents,
                pendingComplaints: resStats.data.pendingComplaints,
                totalNotices: resStats.data.totalNotices,
                monthlyRevenue: resStats.data.monthlyRevenue,
            });

            // Fetch notifications
            const resNotifs = await API.get('/api/admin/notifications');
            const data = resNotifs.data;
            setNotifications(data);

            const deleteReqExists = data.some(n => n.type === 'DELETE_REQUEST');
            setHasDeleteRequest(deleteReqExists);

        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();

        // Auto-refresh dashboard data every 10 seconds
        const interval = setInterval(fetchDashboardData, 10000);
        return () => clearInterval(interval);
    }, [fetchDashboardData]);

    return (
        <div className="admin-main-content">
            <header className="dashboard-header-inline">
                <div className="header-title-flex">
                    <h1>Dashboard Overview</h1>
                    {hasDeleteRequest && (
                        <div className="admin-signal-alert" onClick={() => navigate('/admin/residents')}>
                            <span className="pulse-dot"></span>
                            <span className="signal-label">Account Deletion Request!</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Stats Section */}
            <div className="stats-container">
                <div className="stat-card">
                    <span className="stat-icon">👥</span>
                    <div className="stat-details">
                        <h3>{stats.totalResidents}</h3>
                        <p>Total Residents</p>
                    </div>
                </div>
                <div className="stat-card urgent-card">
                    <span className="stat-icon">⚠️</span>
                    <div className="stat-details">
                        <h3>{stats.pendingComplaints}</h3>
                        <p>Pending Complaints</p>
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">📢</span>
                    <div className="stat-details">
                        <h3>{stats.totalNotices}</h3>
                        <p>Active Notices</p>
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">💰</span>
                    <div className="stat-details">
                        <h3>₹{Number(stats.monthlyRevenue).toLocaleString()}</h3>
                        <p>Monthly Revenue</p>
                    </div>
                </div>
            </div>

            {/* Notification Section */}
            <section className="notifications-section">
                <h2>🔔 Recent Alerts & Requests</h2>
                <div className="notification-list">
                    {notifications.length > 0 ? (
                        notifications.map((notif) => (
                            <div key={notif.id} className={`notification-item ${notif.type === 'DELETE_REQUEST' ? 'urgent-notif' : ''}`}>
                                <div className="notification-content">
                                    <p>
                                        {notif.type === 'DELETE_REQUEST' && <strong>🚨 </strong>}
                                        {notif.message}
                                    </p>
                                    <small>{new Date(notif.created_at).toLocaleString()}</small>
                                </div>
                                {notif.type === 'DELETE_REQUEST' && (
                                    <button 
                                        onClick={() => navigate('/admin/residents')} 
                                        className="notification-manage-btn urgent-btn"
                                    >
                                        Manage Resident
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="notification-empty">
                            <div className="notification-empty-icon">🔕</div>
                            <p>No new notifications.</p>
                        </div>
                    )}
                </div>
            </section>

            <section className="quick-actions-section" style={{ marginTop: '30px' }}>
                <h2>Quick Actions</h2>
                <div className="action-grid">
                    <div className="action-box" onClick={() => navigate('/admin/notices')}>
                        <h4>New Announcement</h4>
                        <p>Broadcast a message to all residents.</p>
                    </div>

                    <div className="action-box" onClick={() => navigate('/admin/complaints')}>
                        <h4>Manage Complaints</h4>
                        <p>Review and resolve pending issues.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default AdminDashboard;