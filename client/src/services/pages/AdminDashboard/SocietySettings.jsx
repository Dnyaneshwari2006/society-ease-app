import React, { useState, useEffect } from 'react';
import API from '../../../api';
import './SocietySettings.css';

// 🚀 Render Backend ka URL yahan dalein
const BACKEND_URL = "https://society-ease-backend.onrender.com"; 

function SocietySettings() {
    const [settings, setSettings] = useState({ society_name: '', maintenance_amount: '', qr_image: '' });
    const [admins, setAdmins] = useState([]); 
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSettings();
        fetchAdmins();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await API.get('/api/society/settings');
            setSettings(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchAdmins = async () => {
        try {
            const res = await API.get('/api/admin/list-admins'); 
            setAdmins(res.data);
        } catch (err) { console.error(err); }
    };

    const handleDeleteAdmin = async (id, name) => {
        if (!window.confirm(`Are you sure you want to remove Admin: ${name}?`)) return;
        try {
            const res = await API.delete(`/api/admin/remove-admin/${id}`);
            alert(res.data.message);
            fetchAdmins();
        } catch (err) { alert(err.response?.data?.error || "Error"); }
    };

    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleTextUpdate = async (e) => {
        e.preventDefault();
        try {
            await API.put('/api/admin/update-society-settings', settings);
            alert("✅ Saved!");
        } catch (err) { alert("❌ Failed"); }
    };

    const handleQrUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) return alert("Select file first!");
        setLoading(true);
        const formData = new FormData();
        formData.append('qrCode', selectedFile);
        try {
            await API.post('/api/admin/upload-qr', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("✅ QR Published!");
            fetchSettings();
            setPreview(null);
            setSelectedFile(null);
        } catch (err) { alert("❌ Upload failed."); }
        finally { setLoading(false); }
    };

    // Helper: Use Cloudinary URL or Local path
    const getQrUrl = (img) => {
        if (!img) return null;
        return img.startsWith('http') ? img : `${BACKEND_URL}/uploads/qr_codes/${img}`;
    };

    return (
        <div className="settings-container-medium">
            <div className="settings-card-medium">
                <div className="settings-header">
                    <h2>⚙️ Society Configuration</h2>
                </div>

                <form onSubmit={handleTextUpdate} className="text-settings-form">
                    <div className="input-group-row">
                        <input type="text" value={settings.society_name || ''} onChange={(e) => setSettings({...settings, society_name: e.target.value})} placeholder="Society Name" />
                        <input type="number" value={settings.maintenance_amount || ''} onChange={(e) => setSettings({...settings, maintenance_amount: e.target.value})} placeholder="Maintenance Fee" />
                    </div>
                    <button type="submit" className="save-btn">Save Text Details</button>
                </form>

                <hr className="divider" />

                <div className="settings-grid">
                    <div className="qr-section">
                        <span>Current Live QR</span>
                        <div className="qr-frame">
                            {settings.qr_image ? <img src={getQrUrl(settings.qr_image)} alt="QR" /> : "No QR Set"}
                        </div>
                    </div>
                    <form onSubmit={handleQrUpload} className="qr-section">
                        <span>Upload New QR</span>
                        <label className="compact-dropzone">
                            <input type="file" onChange={onFileChange} accept="image/*" hidden />
                            {preview ? <img src={preview} alt="Preview" className="preview-img" /> : "Click to select"}
                        </label>
                        <button type="submit" className="publish-btn" disabled={loading}>{loading ? "Publishing..." : "Update QR Image"}</button>
                    </form>
                </div>

                <hr className="divider" />

                <div className="admin-management-section">
                    <h3>👥 Admin Accounts</h3>
                    <div className="admin-list">
                        {admins.map(admin => (
                            <div key={admin.id} className="admin-item-row">
                                <div className="admin-info"><strong>{admin.name}</strong><span>{admin.email}</span></div>
                                <button className="remove-admin-btn" onClick={() => handleDeleteAdmin(admin.id, admin.name)}>Remove</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SocietySettings;