import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../../api'; 
import './ResidentLogs.css';

function ResidentLogs() {
    const [residents, setResidents] = useState([]); 
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedResident, setSelectedResident] = useState(null);
    const [unreadRequests, setUnreadRequests] = useState(0); // ✅ New: For Red Signal

    const navigate = useNavigate();

    // 1. Fetch Residents and Notification Count
    const fetchData = async () => {
        try {
            // Residents load karein
            const res = await API.get('/api/admin/residents');
            setResidents(res.data);

            // ✅ Admin Notifications check karein (Delete Requests ke liye)
            const notifyRes = await API.get('/api/admin/stats'); 
            // Stats route se pendingComplaints ya specific delete requests count le sakte hain
            setUnreadRequests(notifyRes.data.pendingComplaints || 0); 
        } catch (err) {
            console.error("Error loading data:", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const confirmDelete = (resident) => {
        setSelectedResident(resident);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        try {
            const response = await API.delete(`/api/admin/residents/${selectedResident.id}`); //
            alert(response.data.message || `Resident ${selectedResident.name} removed!`);
            setIsDeleteModalOpen(false);
            fetchData(); // List refresh karein
        } catch (err) {
            const errorMsg = err.response?.data?.error || "Error deleting resident.";
            alert(errorMsg);
        }
    };

    return (
        <div className="resident-logs-page">
            <div className="header-flex">
                <div className="title-section">
                    <h2>👥 Resident Directory</h2>
                    <span className="count-badge">Total: {residents.length}</span>
                </div>

                {/* ✅ RED SIGNAL SECTION: Agar requests hain toh blink karega */}
                <div className="admin-alerts">
                    {unreadRequests > 0 && (
                        <div className="notification-signal" onClick={() => navigate('/admin/notifications')}>
                            <span className="red-dot"></span>
                            <span className="signal-text">{unreadRequests} Pending Requests</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="table-wrapper">
                <table className="resident-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Flat No</th>
                            <th>Email</th>
                            <th style={{ textAlign: 'center' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {residents.length > 0 ? residents.map((res) => (
                            <tr key={res.id}>
                                <td>{res.name}</td>
                                <td>{res.room_no || res.flat_no || 'N/A'}</td> 
                                <td>{res.email}</td>
                                <td className="action-cell">
                                    <button 
                                        className="delete-btn-action" 
                                        onClick={() => confirmDelete(res)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>No residents found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* DELETE MODAL */}
            {isDeleteModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content-glass delete-modal">
                        <div className="warning-icon">⚠️</div>
                        <h3>Are you sure?</h3>
                        <p>Remove <strong>{selectedResident?.name}</strong>?</p>
                        <div className="modal-actions">
                            <button className="confirm-delete-btn" onClick={handleDelete}>Delete Anyway</button>
                            <button className="close-btn" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ResidentLogs;