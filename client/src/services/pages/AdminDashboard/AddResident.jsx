import React, { useState } from 'react';
import API from '../../../api';
import './AddResident.css';

function AddResident() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        flat_no: ''
    });

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // We send the 'role' as 'resident' automatically so the admin doesn't have to type it
            await API.post('/api/auth/register', { ...formData, role: 'resident' });
            alert("✅ Resident onboarded successfully!");
            setFormData({ name: '', email: '', password: '', flat_no: '' });
        } catch (err) {
            alert(err.response?.data || "❌ Error adding resident");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-resident-page">
            <div className="form-container-glass">
                <div className="form-header">
                    <h2>Onboard New Resident</h2>
                    <p>Create a secure account for a society member</p>
                </div>

                <form onSubmit={handleSubmit} className="resident-form">
                    <div className="input-row">
                        <div className="input-group">
                            <label>Full Name</label>
                            <input type="text" placeholder="John Doe" 
                                value={formData.name} required
                                onChange={(e) => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="input-group">
                            <label>Flat Number</label>
                            <input type="text" placeholder="B-402" 
                                value={formData.flat_no} required
                                onChange={(e) => setFormData({...formData, flat_no: e.target.value})} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Email Address</label>
                        <input type="email" placeholder="resident@email.com" 
                            value={formData.email} required
                            onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>

                    <div className="input-group">
                        <label>Temporary Password</label>
                        <input type="password" placeholder="••••••••" 
                            value={formData.password} required
                            onChange={(e) => setFormData({...formData, password: e.target.value})} />
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? "Processing..." : "Create Account"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AddResident;