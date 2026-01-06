import React, { useState, useEffect } from 'react';
import API from '../../../api';
import './Profile.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 

function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const rawUser = localStorage.getItem('user');
                if (!rawUser) return;
                
                const savedUser = JSON.parse(rawUser);
                
                // 1. Fetch Real-time User Data (includes room_no/flat_no)
                const res = await API.get(`/api/auth/me/${savedUser.id}`);
                setUser(res.data);

                // 2. Fetch Payment History
                const payRes = await API.get(`/api/resident/payment-history/${savedUser.id}`);
                setPayments(Array.isArray(payRes.data) ? payRes.data : []);

            } catch (err) {
                console.error("Profile fetch error:", err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);
   

    const downloadReceipt = (p) => {
        try {
            const doc = new jsPDF();
            doc.setFontSize(22);
            doc.setTextColor(102, 126, 234); 
            doc.text("SocietyEase Official Receipt", 105, 20, { align: "center" });

            // Using direct function call to avoid 'doc.autoTable is not a function'
            autoTable(doc, {
                startY: 40,
                head: [['Field', 'Description']],
                body: [
                    ['Resident Name', user.name || 'N/A'],
                    ['Flat Number', user.room_no || user.flat_no || 'Not Assigned'],
                    ['Month/Year', p.month_year || 'N/A'],
                    ['Amount Paid', `INR ${p.amount || 0}`],
                    ['Transaction ID', p.transaction_id || 'N/A'],
                    ['Status', 'Verified ✅']
                ],
                theme: 'grid',
                headStyles: { fillColor: [118, 75, 162] },
            });

            doc.save(`Receipt_${p.month_year}.pdf`);
        } catch (error) {
            console.error("PDF Error:", error);
            alert("Could not generate PDF.");
        }
    };

    const handleRequestDelete = async () => {
    const confirmDelete = window.confirm("Request account deletion?");
    if (!confirmDelete) return;

    try {
        // 1. Purana logic update
        await API.put(`/api/resident/request-delete/${user.id}`);

        // 2. NAYA logic: Admin ko detailed message bhejhein
        const detailedMessage = `Resident ${user.name} from Flat ${user.flat_no || 'N/A'} has requested account deletion.`;

        await API.post('/api/notifications', {
            sender_id: user.id,
            message: detailedMessage,
            type: 'DELETE_REQUEST'
        });

        alert("Request sent! Admin can now see your details.");
    } catch (err) {
        alert("Failed to send request.");
    }
};

    if (loading) return <div className="profile-loading">Fetching data...</div>;
    if (!user) return <div className="profile-loading">User not found.</div>;

    return (
        <div className="profile-wrapper">
            <div className="profile-header-section">
                <h1>👤 My Profile</h1>
                <p>Real-time information and payment history</p>
            </div>

            <div className="profile-grid">
                <div className="profile-main-card">
                    <div className="profile-avatar-section">
                        <div className="avatar-circle">
                            <span>{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="user-title-info">
                            <h2>{user.name}</h2>
                        </div>
                        <div className="status-badge-active">Active Resident</div>
                    </div>

                    <div className="profile-details-grid">
                        <div className="detail-item">
                            <div className="detail-icon">🏠</div>
                            <div className="detail-content">
                                <span className="detail-label">Flat Number</span>
                                {/* Real-time room_no display */}
                                <strong className="detail-value">{user.flat_no || 'Not Assigned'}</strong>
                            </div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-icon">📧</div>
                            <div className="detail-content">
                                <span className="detail-label">Email Address</span>
                                <strong className="detail-value">{user.email}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-actions-card">
                    <h3>⚙️ Settings</h3>
                    <button className="delete-request-btn" onClick={handleRequestDelete}>
                        🗑️ Request Account Deletion
                    </button>
                </div>

                <div className="profile-main-card payment-history-full">
                    <h3>💳 Payment History</h3>
                    <div className="payment-list-compact">
                        {payments.length > 0 ? payments.map((p) => (
                            <div key={p.id} className="pay-item-card">
                                <div>
                                    <span className="pay-month">{p.month_year}</span>
                                    <span className="pay-amt">₹{p.amount}</span>
                                </div>
                                <div>
                                    <span className={`pay-status ${p.status.toLowerCase()}`}>{p.status}</span>
                                    {p.status === 'Verified' && (
                                        <button onClick={() => downloadReceipt(p)} className="mini-pdf-btn">📥 PDF</button>
                                    )}
                                </div>
                            </div>
                        )) : <p>No history.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;