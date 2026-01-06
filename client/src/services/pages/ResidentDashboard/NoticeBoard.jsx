import React, { useEffect, useState } from 'react';
import API from '../../../api';
import './NoticeBoard.css';

function NoticeBoard() {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetching notices from the backend
        const fetchNotices = async () => {
            try {
                const res = await API.get('/api/notices');
                setNotices(res.data);
            } catch (err) {
                console.error("Error fetching notices:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchNotices();
    }, []);

    return (
        <div className="notice-board-page">
            <header className="notice-header">
                <h1>📢 Society Notice Board</h1>
                <p>Stay informed about the latest community updates and events.</p>
            </header>

            {loading ? (
                <div className="loading-state">Fetching latest updates...</div>
            ) : (
                <div className="notices-grid">
                    {notices.length > 0 ? (
                        notices.map((notice) => (
                            <div key={notice.id} className="notice-card">
                                <div className="notice-meta">
                                    <span className="notice-category">Official Announcement</span>
                                    <span className="notice-date">
                                        {new Date(notice.created_at).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <h3>{notice.title}</h3>
                                <p>{notice.content}</p>
                                <div className="notice-footer">
                                    <span>Issued by: Society Management</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-notices">
                            <div className="empty-icon">📭</div>
                            <h3>No New Notices</h3>
                            <p>Everything is quiet for now. We'll post here when there's an update!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default NoticeBoard;