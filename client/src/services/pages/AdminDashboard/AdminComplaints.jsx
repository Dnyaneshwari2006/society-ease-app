import React, { useEffect, useState } from 'react';
import API from '../../../api';
import './AdminComplaints.css';

function AdminComplaints() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const res = await API.get('/api/admin/complaints'); 
                setComplaints(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Error fetching complaints:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchComplaints();
    }, []);

    const handleResolve = async (id) => {
        try {
            await API.put(`/api/complaints/${id}/resolve`);
            setComplaints(complaints.map(c => 
                c.id === id ? { ...c, status: 'Resolved' } : c
            ));
            alert("✅ Complaint marked as resolved!");
        } catch (err) {
            alert("❌ Failed to update status.");
        }
    };

    return (
        <div className="admin-complaints-page">
            <div className="table-container-glass">
                <div className="table-header">
                    <h2>🛠️ Resident Complaints</h2>
                    <p>Track and resolve maintenance issues reported by society members</p>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <p className="loading-text">Fetching latest reports...</p>
                    </div>
                ) : (
                    /* ZARURI: Table ko is wrapper mein rakha hai scroll ke liye */
                    <div className="table-responsive-wrapper">
                        <table className="complaints-table">
                            <thead>
                                <tr>
                                    <th>Flat No</th>
                                    <th>Resident</th>
                                    <th>Issue Description</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {complaints.length > 0 ? (
                                    complaints.map((c) => (
                                        <tr key={c.id}>
                                            <td><strong>{c.flat_no}</strong></td>
                                            <td>{c.name}</td> 
                                            <td className="desc-cell">{c.description}</td>
                                            <td>
                                                <span className={`status-badge-small ${c.status.toLowerCase()}`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td>
                                                {c.status !== 'Resolved' ? (
                                                    <button 
                                                        className="resolve-btn"
                                                        onClick={() => handleResolve(c.id)}
                                                    >
                                                        Mark Resolved
                                                    </button>
                                                ) : (
                                                    <span className="resolved-check">✅ Completed</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="no-data">No pending complaints found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminComplaints;