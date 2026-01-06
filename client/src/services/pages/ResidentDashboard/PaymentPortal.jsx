import React, { useState, useEffect } from 'react';
import API from '../../../api';
import './PaymentPortal.css';

// 🚀 STEP 1: Ise apne Laptop IP se badlein (Jo api.js mein hai)
const BACKEND_URL = "http://192.168.31.29:5000"; 

function PaymentPortal() {
    const [qrUrl, setQrUrl] = useState('');
    const [societyName, setSocietyName] = useState('Society');
    const [payment, setPayment] = useState({ 
        amount: '', 
        transaction_id: '', 
        month_year: 'January 2026' 
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await API.get('/api/society/settings');
                console.log("Database response:", res.data); 
                
                if (res.data && res.data.qr_image) {
                    // 🚀 STEP 2: localhost ki jagah BACKEND_URL use karein
                    const fullUrl = `${BACKEND_URL}/uploads/qr_codes/${res.data.qr_image}`;
                    console.log("Loading Image from:", fullUrl);
                    setQrUrl(fullUrl);
                    
                    setSocietyName(res.data.society_name || 'Society');
                    setPayment(prev => ({ 
                        ...prev, 
                        amount: res.data.maintenance_amount || '1000' 
                    }));
                }
            } catch (err) {
                console.error("Error fetching settings:", err);
            }
        };
        fetchSettings();
    }, []);


    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);

        const user = JSON.parse(localStorage.getItem('user'));
        
        const paymentData = {
            resident_id: user.id, 
            amount: payment.amount,
            transaction_id: payment.transaction_id,
            month_year: payment.month_year,
            status: 'Pending', 
            method: 'UPI'
        };

        try {
            await API.post('/api/resident/pay', paymentData);
            alert(`✅ Payment for ${societyName} Recorded! Admin will verify your transaction.`);
            setPayment({ ...payment, transaction_id: '' });
        } catch (err) {
            alert(err.response?.data?.message || "❌ Payment failed to record.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="payment-page-container">
            <div className="payment-card-glass">
                <div className="payment-header">
                    <h2>💳 {societyName} Maintenance</h2>
                    <p>Pay your dues securely via UPI</p>
                </div>

                <div className="payment-flex">
                    <div className="qr-container">
                        <div className="qr-box">
                            {qrUrl ? (
                                <img src={qrUrl} alt="Society QR Code" className="qr-image" />
                            ) : (
                                <div className="qr-placeholder">Loading QR Code...</div>
                            )}
                        </div>
                        <div className="upi-details">
                            <p>Scan to pay via any UPI App</p>
                        </div>
                    </div>

                    <form onSubmit={handlePayment} className="payment-form">
                        <div className="payment-input-group">
                            <label>Amount Due (₹)</label>
                            <input 
                                type="number" 
                                value={payment.amount} 
                                readOnly 
                                className="amount-input" 
                            />
                        </div>

                        <div className="payment-input-group">
                            <label>Transaction ID / UTR Number</label>
                            <input 
                                type="text"
                                placeholder="Enter 12-digit UTR" 
                                value={payment.transaction_id}
                                onChange={(e) => setPayment({...payment, transaction_id: e.target.value})} 
                                required 
                            />
                        </div>

                        <button type="submit" className="pay-submit-btn" disabled={loading}>
                            {loading ? "Processing..." : "Confirm Payment"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default PaymentPortal;