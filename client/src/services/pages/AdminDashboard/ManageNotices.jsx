import React, { useState, useEffect } from 'react';
import API from '../../../api';
import './ManageNotices.css'; 

function ManageNotices() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState(''); 
    const [loading, setLoading] = useState(false);
    const [notices, setNotices] = useState([]);

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            const res = await API.get('/api/notices'); 
            setNotices(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    const handlePost = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await API.post('/api/admin/notices', { title, description });
            alert(res.data.message);
            setTitle('');
            setDescription('');
            fetchNotices(); 
        } catch (err) {
            alert(err.response?.data?.message || "❌ Failed to post notice.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("⚠️ Are you sure you want to remove this notice?")) {
            try {
                await API.delete(`/api/admin/notices/${id}`);
                fetchNotices();
            } catch (err) {
                alert("❌ Error deleting notice");
            }
        }
    };

    return (
        <div className="admin-page-container">
            {/* Pehla Card: Post Announcement Form */}
            <div className="form-container-glass">
                <div className="form-header">
                    <h2>Society Announcements</h2>
                    <p>Post a new notice to the digital board for all residents to see</p>
                </div>

                <form onSubmit={handlePost} className="notice-form">
                    <div className="input-group">
                        <label>Announcement Title</label>
                        <input 
                            type="text" 
                            placeholder="e.g., Annual General Meeting (AGM)" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="input-group">
                        <label>Detailed Content</label>
                        <textarea 
                            placeholder="Provide full details here..." 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)} 
                            required 
                            rows="4"
                        />
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? "Publishing..." : "Post Announcement"}
                    </button>
                </form>
            </div>

            {/* Dusra Card: Notice History - Mobile par ye upar-niche stack ho jayega */}
            <div className="form-container-glass">
                <div className="form-header">
                    <h3>Notice History</h3>
                    <p>Manage and track all previously posted announcements</p>
                </div>

                {/* Wrapper for horizontal scroll on mobile */}
                <div className="notice-table-wrapper">
                    <table className="custom-admin-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Title</th>
                                <th>Message</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notices.length > 0 ? notices.map((n) => (
                                <tr key={n.id}>
                                    <td className="date-cell">
                                        {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="title-cell">{n.title || 'Untitled'}</td>
                                    <td className="msg-cell">
                                        {n.description ? n.description.substring(0, 50) : "No description"}...
                                    </td>
                                    <td>
                                        <button onClick={() => handleDelete(n.id)} className="delete-icon-btn">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="no-data">No notices found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ManageNotices;