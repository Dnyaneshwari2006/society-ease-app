import React, { useEffect, useState } from 'react';
import API from '../../../api';
import './PaymentTracker.css';

function PaymentTracker() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const res = await API.get('/api/admin/payments');
            setPayments(res.data);
        } catch (err) {
            console.error("Error fetching payments:", err);
        } finally {
            setLoading(false);
        }
    };

   const handleApprove = async (paymentId) => {
    try {
        // 1. Backend call to verify
        await API.put(`/api/admin/verify-payment/${paymentId}`);
        
        // 2. ✅ SUCCESS: List se us item ko turant hatao (Filter state)
        // Yahi step missing hone se "Failed to update UI" aata hai
        setPayments(prev => prev.filter(p => p.id !== paymentId));
        
        alert("✅ Payment Verified Successfully!");
    } catch (err) {
        console.error("Approve Error:", err);
        // Agar alert "Failed to update UI" aa raha hai, toh yahan logic check karein
        alert("❌ Failed to update UI. Check if backend returned success.");
    }
};

    return (
    <div className="payment-tracker-page">
        <div className="table-container-glass">
            <div className="table-header-info">
                <h2>Resident Payment Verifications</h2>
                <p>Cross-check the UTR numbers with your bank statement before approving.</p>
            </div>

            {loading ? (
                <p className="loading-text">Loading records...</p>
            ) : (
                <div className="table-responsive">
                    <table className="payment-table">
                        <thead>
                            <tr>
                                <th>Resident Name</th>
                                <th>Flat</th>
                                <th>Amount</th>
                                <th>Transaction ID</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length > 0 ? (
                                payments.map((p) => (
                                    <tr key={p.id}>
                                        <td>{p.user_name}</td>
                                        <td>{p.flat_no}</td>
                                        <td>₹{p.amount}</td>
                                        <td><span className="utr-badge">{p.transaction_id}</span></td>
                                        <td>
                                            <span className={`status-pill ${p.status.toLowerCase()}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td>
                                            {p.status === 'Pending' ? (
                                                <button 
                                                    className="approve-btn"
                                                    onClick={() => handleApprove(p.id)}
                                                >
                                                    Approve
                                                </button>
                                            ) : (
                                                <span className="verified-text">✅Verified</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="no-data">No pending payments found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    </div>
);
}

export default PaymentTracker;