import React, { useState, useEffect } from 'react';
import API from '../../../api';
import './PaymentPortal.css';

function PaymentPortal() {
    const [qrUrl, setQrUrl] = useState('');
    const [societyName, setSocietyName] = useState('Society');
    const [unpaidBills, setUnpaidBills] = useState([]); // ✅ Added: To hold real bills
    const [selectedBill, setSelectedBill] = useState(null); // ✅ Added: Selected bill from dropdown
    const [transactionId, setTransactionId] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchPortalData = async () => {
            const user = JSON.parse(localStorage.getItem('user'));
            try {
                // 1. Fetch Society Settings (QR & Name)
                const settings = await API.get('/api/society/settings');
                setQrUrl(settings.data.qr_image);
                setSocietyName(settings.data.society_name || 'Society');

                // 2. Fetch Actual Unpaid Bills from DB (ID 51-56 jaise)
                const bills = await API.get(`/api/resident/unpaid-bills/${user.id}`);
                setUnpaidBills(bills.data);
                if (bills.data.length > 0) setSelectedBill(bills.data[0]); // Default first bill
            } catch (err) {
                console.error("Portal load error:", err);
            }
        };
        fetchPortalData();
    }, []);

    const handlePayment = async (e) => {
        e.preventDefault();
        if (!selectedBill) return alert("No pending bills to pay!");
        setLoading(true);

        try {
            // ✅ FIX: Naya post nahi, existing record UPDATE karna hai
            await API.put('/api/resident/submit-payment', {
                payment_id: selectedBill.id, // Record ID (e.g., 51)
                transaction_id: transactionId
            });

            alert(`✅ Payment for ${selectedBill.month_name} Recorded!`);
            window.location.reload(); // Refresh to update dues
        } catch (err) {
            alert("❌ Payment failed to record.");
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
                            {qrUrl ? <img src={qrUrl} alt="QR" className="qr-image" /> : <div className="qr-placeholder">Loading QR...</div>}
                        </div>
                    </div>

                    <form onSubmit={handlePayment} className="payment-form">
                        <div className="payment-input-group">
                            <label>Select Bill to Pay</label>
                            <select 
                                onChange={(e) => setSelectedBill(unpaidBills.find(b => b.id === parseInt(e.target.value)))}
                                className="bill-select"
                            >
                                {unpaidBills.map(bill => (
                                    <option key={bill.id} value={bill.id}>
                                        {bill.month_name} {bill.year} - ₹{bill.amount}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="payment-input-group">
                            <label>Transaction ID / UTR Number</label>
                            <input 
                                type="text"
                                placeholder="Enter 12-digit UTR" 
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)} 
                                required 
                            />
                        </div>

                        <button type="submit" className="pay-submit-btn" disabled={loading || !selectedBill}>
                            {loading ? "Processing..." : "Confirm Payment"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default PaymentPortal;