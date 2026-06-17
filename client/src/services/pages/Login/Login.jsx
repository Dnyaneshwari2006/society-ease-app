import React, { useState } from 'react';
import API from "../../../api"; 
import { useNavigate } from 'react-router-dom';
import './Login.css'; 

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
    e.preventDefault();
    try {
        const res = await API.post('/api/auth/login', { email, password });
        
        // Save the user data including the role
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));

        // Logic check:
        if (res.data.user.role === 'admin') {
            navigate('/admin'); // This sends you to the admin side
        } else {
            navigate('/resident-dashboard');
        }
    } catch (err) {
        alert("Login failed.");
    }
};

    const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
        const res = await API.post('/api/auth/forgot-password', { email });
        alert(res.data); // Should show "Credentials sent to your email!"
    } catch (err) {
        alert(err.response?.data || "Something went wrong");
    }
};

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">SocietyEase Login</h2>
                <form onSubmit={handleLogin}>
                    <input 
                        type="email" 
                        className="login-input"
                        placeholder="Email Address" 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                    <input 
                        type="password" 
                        className="login-input"
                        placeholder="Password" 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                    <button type="submit" className="login-button">Sign In</button>
                </form>
                
                <div className="auth-footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '14px' }}>
                    <span 
                        onClick={handleForgotPassword} 
                        style={{ color: '#764ba2', cursor: 'pointer', fontWeight: '500' }}
                    >
                        Forgot Password?
                    </span>
                    <a href="/register" style={{ color: '#764ba2', textDecoration: 'none', fontWeight: '500' }}>
                        Create Account
                    </a>
                </div>
            </div>
        </div>
    );
}

export default Login;