import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../../api';
import './Login.css'; // Reuse your clean white card styles

function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');

    const handleReset = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post(`/api/auth/reset-password/${token}`, { newPassword });
            alert(res.data);
            navigate('/login');
        } catch (err) {
            alert(err.response?.data || "Failed to reset password.");
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Set New Password</h2>
                <form onSubmit={handleReset}>
                    <input 
                        className="login-input"
                        type="password" 
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required 
                    />
                    <button type="submit" className="login-button">Update Password</button>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;