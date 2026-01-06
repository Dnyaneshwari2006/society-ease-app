import React, { useState, useEffect } from 'react';
import API from '../../../api';
import './SocietySettings.css';

// 🚀 Laptop ka IP (Same as api.js)
const BACKEND_URL = "http://192.168.31.29:5000"; 

function SocietySettings() {
    const [settings, setSettings] = useState({ society_name: '', maintenance_amount: '', qr_image: '' });
    const [admins, setAdmins] = useState([]); // 👥 Admins list state
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSettings();
        fetchAdmins(); // Load admins on mount
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await API.get('/api/society/settings');
            setSettings(res.data);
        } catch (err) {
            console.error("Error fetching settings", err);
        }
    };

    // 1. Fetch All Admins
    const fetchAdmins = async () => {
        try {
            // Ensure you have this route in server.js
            const res = await API.get('/api/admin/list-admins'); 
            setAdmins(res.data);
        } catch (err) {
            console.error("Error fetching admins", err);
        }
    };

    // 2. Delete Admin Function
    const handleDeleteAdmin = async (adminId, adminName) => {
        const confirmDelete = window.confirm(`Are you sure you want to remove Admin: ${adminName}?`);
        if (!confirmDelete) return;

        try {
            const res = await API.delete(`/api/admin/remove-admin/${adminId}`);
            alert(res.data.message);
            fetchAdmins(); // Refresh list after deletion
        } catch (err) {
            alert(err.response?.data?.error || "Failed to delete admin");
        }
    };

    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                alert("⚠️ Please upload a JPG, PNG, or WEBP file.");
                return;
            }
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleTextUpdate = async (e) => {
        e.preventDefault();
        try {
            await API.put('/api/admin/update-society-settings', {
                society_name: settings.society_name,
                maintenance_amount: settings.maintenance_amount
            });
            alert("✅ Society details saved!");
        } catch (err) {
            alert("❌ Update failed.");
        }
    };

    const handleQrUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) return alert("Please select an image first!");

        setLoading(true);
        const formData = new FormData();
        formData.append('qrCode', selectedFile);

        try {
            await API.post('/api/admin/upload-qr', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("✅ Society QR Code published!");
            fetchSettings(); 
            setPreview(null);
            setSelectedFile(null);
        } catch (err) {
            alert("❌ Upload failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-container-medium">
            <div className="settings-card-medium">
                <div className="settings-header">
                    <h2>⚙️ Society Configuration</h2>
                    <p>Manage payment settings, branding, and administrators</p>
                </div>

                {/* --- SECTION 1: TEXT SETTINGS --- */}
                <form onSubmit={handleTextUpdate} className="text-settings-form">
                    <div className="input-group-row">
                        <input 
                            type="text" 
                            placeholder="Society Name"
                            value={settings.society_name || ''} 
                            onChange={(e) => setSettings({...settings, society_name: e.target.value})}
                        />
                        <input 
                            type="number" 
                            placeholder="Maintenance Amount (₹)"
                            value={settings.maintenance_amount || ''} 
                            onChange={(e) => setSettings({...settings, maintenance_amount: e.target.value})}
                        />
                    </div>
                    <button type="submit" className="save-btn">Save Text Details</button>
                </form>

                <hr className="divider" />

                {/* --- SECTION 2: QR CODE SETTINGS --- */}
                <div className="settings-grid">
                    <div className="qr-section">
                        <span>Current Live QR</span>
                        <div className="qr-frame">
                            {settings.qr_image ? (
                                <img src={`${BACKEND_URL}/uploads/qr_codes/${settings.qr_image}`} alt="Current QR" />
                            ) : <p>No QR Set</p>}
                        </div>
                    </div>

                    <form onSubmit={handleQrUpload} className="qr-section">
                        <span>Upload New QR</span>
                        <label className="compact-dropzone">
                            <input type="file" onChange={onFileChange} accept="image/*" hidden />
                            {preview ? (
                                <img src={preview} alt="New Preview" className="preview-img" />
                            ) : (
                                <div className="placeholder">
                                    <span className="plus">+</span>
                                    <p>Select File</p>
                                </div>
                            )}
                        </label>
                        <button type="submit" className="publish-btn" disabled={loading}>
                            {loading ? "Publishing..." : "Update QR Image"}
                        </button>
                    </form>
                </div>

                <hr className="divider" />

                {/* --- SECTION 3: ADMIN MANAGEMENT (NEW) --- */}
                <div className="admin-management-section">
                    <h3>👥 Admin Accounts</h3>
                    <p style={{fontSize: '0.85rem', color: '#718096', marginBottom: '1rem'}}>
                        Remove old admin accounts after creating a new one.
                    </p>
                    <div className="admin-list">
                        {admins.length > 0 ? admins.map(admin => (
                            <div key={admin.id} className="admin-item-row">
                                <div className="admin-info">
                                    <strong>{admin.name}</strong>
                                    <span>{admin.email}</span>
                                </div>
                                <button 
                                    className="remove-admin-btn"
                                    onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                                >
                                    Remove
                                </button>
                            </div>
                        )) : <p>Loading admins...</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SocietySettings;