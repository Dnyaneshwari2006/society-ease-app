import React, { useState } from 'react';
import API from '../../../api';
import './ComplaintForm.css';

function ComplaintForm() {
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Plumbing');
    const [loading, setLoading] = useState(false);

    // In ComplaintForm.jsx inside handleSubmit
const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Get the logged-in user from localStorage
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const currentUserId = storedUser?.id; 

    if (!currentUserId) {
        alert("❌ You must be logged in to submit a complaint.");
        setLoading(false);
        return;
    }

    try {
        await API.post('/api/complaints', { 
            description, 
            category,
            user_id: currentUserId // Use the dynamic ID from the login session
        });
        alert("✅ Complaint submitted successfully!");
        setDescription('');
    } catch (err) {
        alert("❌ Failed to submit.");
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="resident-page-container">
            <div className="form-container-glass">
                <div className="form-header">
                    <h2>🛠️ Report an Issue</h2>
                    <p>Describe the problem, and our maintenance team will look into it.</p>
                </div>

                <form onSubmit={handleSubmit} className="complaint-form">
                    <div className="input-group">
                        <label>Issue Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="Plumbing">🚰 Plumbing</option>
                            <option value="Electricity">⚡ Electricity</option>
                            <option value="Security">🛡️ Security</option>
                            <option value="Cleaning">🧹 Cleaning</option>
                            <option value="Others">📦 Others</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Explain the Problem</label>
                        <textarea 
                            placeholder="Describe the issue..." 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows="5"
                        />
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? "Submitting..." : "Submit Complaint"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ComplaintForm; // THE CRITICAL LINE