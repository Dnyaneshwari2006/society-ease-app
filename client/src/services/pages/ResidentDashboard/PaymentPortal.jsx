import React, { useState, useEffect } from 'react';
import API from '../../../api';
import './PaymentPortal.css';

function PaymentPortal() {
    const [qrUrl, setQrUrl] = useState('');
    const [societyName, setSocietyName] = useState('Society');
    const [upiId, setUpiId] = useState(''); // ✅ Added: State to store society/father's UPI string
    const [unpaidBills, setUnpaidBills] = useState([]); 
    const [selectedBill, setSelectedBill] = useState(null); 
    const [transactionId, setTransactionId] = useState('');
    const [loading, setLoading] = useState(false);
    const date = new Date();
    const currentMonthName = date.toLocaleString('default', { month: 'long' });
    const currentYear = date.getFullYear();

    useEffect(() => {
        const fetchPortalData = async () => {
            const rawUser = localStorage.getItem('user');
            if (!rawUser) return;
            const user = JSON.parse(rawUser);

            try {
                // 1. Fetch Society Settings (QR, Name, and UPI ID string)
                const settings = await API.get('/api/society/settings');
                setQrUrl(settings.data.qr_image);
                setSocietyName(settings.data.society_name || 'Society');
                setUpiId(settings.data.upi_id || 'yourfather@upi'); // ✅ Captures real database UPI string

                // 2. Fetch Actual Unpaid Bills from DB
                const bills = await API.get(`/api/resident/unpaid-bills/${user.id}`);
                setUnpaidBills(bills.data);
                
                if (bills.data.length > 0) {
                    setSelectedBill(bills.data[0]);
                }
            } catch (err) {
                console.error("Portal load error:", err);
            }
        };
        fetchPortalData();
    }, []);

    // ✅ Added: Generate Dynamic UPI Deep-Link when a bill is chosen
    const generateUpiLink = () => {
        if (!selectedBill || !upiId) return '#';
        const amount = selectedBill.amount;
        const note = `Maint_${selectedBill.month_name}_${selectedBill.year}`.replace(/\s+/g, '_');
        return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(societyName)}&am=${amount}&cu=INR&tn=${note}`;
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        if (!selectedBill) return alert("No pending bills to pay!");
        
        // Validation check for 12-digit structural string integrity
        if (transactionId.trim().length !== 12) {
            return alert("⚠️ Please enter a valid 12-digit UTR/Transaction ID.");
        }

        setLoading(true);

        try {
             await API.put('/api/resident/submit-payment', {
                 payment_id: selectedBill.id, 
                 transaction_id: transactionId
             });

            alert(`✅ Payment for ${selectedBill.month_name} recorded! Admin will verify it soon.`);
            window.location.reload(); 
        } catch (err) {
            alert("❌ Payment failed to record. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="payment-page-container">
            <div className="payment-card-glass">
                <div className="payment-header">
                    <h2>💳 {societyName} Maintenance</h2>
                    <p>Current Billing Period: <strong>{currentMonthName} {currentYear}</strong></p>
                </div>

                <div className="payment-flex">
                    <div className="qr-container">
                        <div className="qr-box">
                            {qrUrl ? (
                                <img src={qrUrl} alt="Society QR" className="qr-image" />
                            ) : (
                                <div className="qr-placeholder">Loading QR Code...</div>
                            )}
                        </div>
                        <div className="upi-details">
                            <p className="desktop-hint">Scan to pay any pending dues</p>
                            
                            {/* ✅ Added: Responsive Mobile Intent Button Row */}
                            {unpaidBills.length > 0 && (
                                <div className="mobile-payment-actions">
                                    <span className="or-divider">—— Mobile Alternative ——</span>
                                    <a href={generateUpiLink()} className="upi-intent-btn">
                                        🚀 Open PhonePe / GPay / Paytm
                                    </a>
                                    <p className="amount-indicator">
                                        Amount: <strong>₹{selectedBill?.amount}</strong>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handlePayment} className="payment-form">
                        <div className="payment-input-group">
                            <label>Select Pending Bill</label>
                            {unpaidBills.length > 0 ? (
                                <select 
                                    onChange={(e) => setSelectedBill(unpaidBills.find(b => b.id === parseInt(e.target.value)))}
                                    className="bill-select"
                                    value={selectedBill?.id || ''}
                                >
                                    {unpaidBills.map(bill => (
                                        <option key={bill.id} value={bill.id}>
                                            {bill.month_name} {bill.year} - ₹{bill.amount}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="no-bills-alert">All bills are paid!</div>
                            )}
                        </div>

                        <div className="payment-input-group">
                            <label>Transaction ID / UTR Number</label>
                            <input 
                                type="text"
                                maxLength="12"
                                placeholder="Enter 12-digit UTR from receipt" 
                                value={transactionId}
                                // Strips non-digits so users don't type text by accident
                                onChange={(e) => setTransactionId(e.target.value.replace(/\D/g, ''))} 
                                required 
                                disabled={unpaidBills.length === 0}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="pay-submit-btn" 
                            disabled={loading || unpaidBills.length === 0}
                        >
                            {loading ? "Recording..." : "Confirm Payment"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default PaymentPortal;