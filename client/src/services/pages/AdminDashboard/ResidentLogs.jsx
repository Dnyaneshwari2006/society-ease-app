import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Navigaton ke liye import add kiya
import API from '../../../api'; 
import './ResidentLogs.css';

function ResidentLogs() {
    const [residents, setResidents] = useState([]); 
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedResident, setSelectedResident] = useState(null);
    
    const navigate = useNavigate(); // 2. Navigate ko yahan initialize kiya

    // 1. Fetch data from DB
    const fetchResidents = () => {
        API.get('/api/admin/residents')
            .then(res => {
                console.log("Residents loaded:", res.data);
                setResidents(res.data);
            })
            .catch(err => console.error("Error fetching residents:", err));
    };

    useEffect(() => {
        fetchResidents();
    }, []);

    const confirmDelete = (resident) => {
        setSelectedResident(resident);
        setIsDeleteModalOpen(true);
    };

    // 2. Updated Delete Function
    const handleDelete = async () => {
        try {
            // Backend call to delete
            const response = await API.delete(`/api/admin/residents/${selectedResident.id}`);
            
            // Success Message
            alert(response.data.message || `Resident ${selectedResident.name} removed successfully!`);
            
            setIsDeleteModalOpen(false);

            // 🚀 Page refresh karne ke bajaye list ko update karenge
            fetchResidents(); 
            
            // Agar aapko dashboard par bhejna hai toh:
            // navigate('/admin-dashboard'); 
            
        } catch (err) {
            console.error("Delete Error:", err);
            // Backend se exact error message dikhayega
            const errorMsg = err.response?.data?.error || "Error deleting resident. Check backend logs.";
            alert(errorMsg);
        }
    };

    return (
        <div className="resident-logs-page">
            <div className="header-flex">
                <h2>👥 Resident Directory</h2>
                <span className="count-badge">Total: {residents.length}</span>
            </div>

            <div className="table-wrapper">
                <table className="resident-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Flat No</th>
                            <th>Email</th>
                            <th style={{ textAlign: 'center' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {residents.length > 0 ? residents.map((res) => (
                            <tr key={res.id}>
                                <td>{res.name}</td>
                                <td>{res.room_no || res.flat_no || 'N/A'}</td> 
                                <td>{res.email}</td>
                                <td className="action-cell">
                                    <button 
                                        className="delete-btn-action" 
                                        onClick={() => confirmDelete(res)}
                                        title="Remove Resident"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                                    No residents found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- DELETE CONFIRMATION MODAL --- */}
            {isDeleteModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content-glass delete-modal">
                        <div className="warning-icon">⚠️</div>
                        <h3>Are you sure?</h3>
                        <p>Do you really want to remove <strong>{selectedResident?.name}</strong>?</p>
                        <p style={{fontSize: '12px', color: '#718096', marginTop: '-10px'}}>
                            (This will also clear their complaints and payments history)
                        </p>
                        <div className="modal-actions">
                            <button className="confirm-delete-btn" onClick={handleDelete}>Delete Anyway</button>
                            <button className="close-btn" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ResidentLogs;