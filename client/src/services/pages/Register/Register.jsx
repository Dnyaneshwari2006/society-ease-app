import React, { useState } from 'react';
import API from '../../../api'; 
import { useNavigate } from 'react-router-dom'; 
import './Register.css'; 

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '', 
        email: '', 
        password: '', 
        flat_no: ''
    });
    const [secretKey, setSecretKey] = useState(''); // New state for admin check

    const handleSubmit = async (e) => {
    e.preventDefault();
    
    const finalRole = secretKey === "SOCIETY2026" ? "admin" : "resident";
    const dataToSubmit = { ...formData, role: finalRole };

    try {
        // ✅ FIX: URL ko backend ke router setup se match karein
        // Pehle ye '/api/auth/register' tha, ise badal kar '/register' karein
        // Kyunki 'API' base URL mein pehle se hi '/api/auth' judaa ho sakta hai
        const response = await API.post('/register', dataToSubmit); 
        
        alert(`Registered successfully as ${finalRole}!`);
        navigate('/login'); 
    } catch (err) {
            const msg = err?.response?.data || 'Register failed';
            alert(msg);
        }
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <h2 className="register-title">SocietyEase Registration</h2>
                
                <form onSubmit={handleSubmit}>
                    <input className="register-input" type="text" placeholder="Full Name" 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                    
                    <input className="register-input" type="email" placeholder="Email Address" 
                        onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                    
                    <input className="register-input" type="password" placeholder="Password" 
                        onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                    
                    <input className="register-input" type="text" placeholder="Flat Number (e.g., B-402)" 
                        onChange={(e) => setFormData({...formData, flat_no: e.target.value})} required />

                    {/* REPLACED Role input with Secret Key input */}
                    <input 
                        className="register-input" 
                        type="password" 
                        placeholder="Admin Secret Key (Leave blank for Resident)" 
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)} 
                    />

                    <button type="submit" className="register-button">Create Account</button>
                </form>
                <div style={{ marginTop: '15px', textAlign: 'center' }}>
                    <a href="/login" style={{ color: '#009efd', fontSize: '14px' }}>Already have an account? Login</a>
                </div>
            </div>
        </div>
    );
}

export default Register;