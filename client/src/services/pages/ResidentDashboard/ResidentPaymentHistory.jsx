import React, { useState, useEffect } from 'react';
import API from '../../../api';
import './ResidentPaymentHistory.css';

function ResidentPaymentHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                // Fetches only this specific resident's payments
                const res = await API.get(`/api/resident/payment-history/${user.id}`);
                setHistory(res.data);
            } catch (err) {
                console.error("Error fetching history:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="history-page-container">
            <div className="history-card">
                <div className="history-header">
                    <h2>📜 Payment Receipts & History</h2>
                    <p>Track your maintenance records and verification status</p>
                </div>

                {loading ? (
                    <div className="loading-spinner">Loading records...</div>
                ) : (
                    <div className="table-wrapper">
                        <table className="custom-history-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Month</th>
                                    <th>Amount</th>
                                    <th>Transaction ID</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.length > 0 ? history.map((h, index) => (
                                    <tr key={index}>
                                        <td>{new Date(h.payment_date).toLocaleDateString()}</td>
                                        <td>{h.month_year}</td>
                                        <td className="amount-col">₹{h.amount}</td>
                                        <td className="utr-col">{h.transaction_id}</td>
                                        <td>
                                            <span className={`status-pill ${h.status.toLowerCase()}`}>
                                                {h.status === 'Verified' ? '✅ Verified' : '⏳ Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="5" className="no-data">No payment history found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResidentPaymentHistory;