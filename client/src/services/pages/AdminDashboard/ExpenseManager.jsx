import React, { useState } from 'react';
import API from '../../../api';
import './ExpenseStyles.css';

function ExpenseManager() {
    const [expense, setExpense] = useState({ 
        title: '', 
        amount: '', 
        category: 'Maintenance',
        description: '',
        spent_date: '' 
    });

    // ✅ FIX 1: Define 'today' to prevent ReferenceError
    // Isse calendar mein future dates block ho jayengi
    const today = new Date().toISOString().split('T')[0];
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // ✅ Cleaned: Directly sending 'expense' state is more efficient
            const res = await API.post('/api/admin/expenses', expense);
            alert("✅ " + res.data.message);
            
            // Reset form
            setExpense({ title: '', amount: '', category: 'Maintenance', description: '', spent_date: '' });
        } catch (err) {
            console.error("Frontend Error:", err.response?.data); 
            alert("❌ Error saving expense. Check backend logs.");
        }
    };

    return (
        <div className="admin-page-container">
            <div className="form-container-glass">
                <div className="form-header">
                    <h2>Record Society Expense</h2>
                    <p>Track out-flow of funds for society upkeep</p>
                </div>
                <form onSubmit={handleSubmit} className="notice-form">
                    <div className="input-group">
                        <label>Expense Title</label>
                        <input type="text" placeholder="e.g., Lift Repair" value={expense.title}
                            onChange={(e) => setExpense({...expense, title: e.target.value})} required />
                    </div>

                    <div className="input-row">
                        <div className="input-group">
                            <label>Amount (₹)</label>
                            <input type="number" placeholder="5000" value={expense.amount}
                                onChange={(e) => setExpense({...expense, amount: e.target.value})} required />
                        </div>
                        <div className="input-group">
                            <label>Category</label>
                            <select value={expense.category} onChange={(e) => setExpense({...expense, category: e.target.value})}>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Electricity">Electricity</option>
                                <option value="Salaries">Staff Salaries</option>
                                <option value="Others">Others</option>
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Spent Date</label>
                        <input 
                            type="date" 
                            value={expense.spent_date}
                            max={today} // ✅ Future dates blocked
                            onChange={(e) => setExpense({...expense, spent_date: e.target.value})} 
                            required 
                        />
                    </div>

                    <div className="input-group">
                        <label>Description (Optional)</label>
                        <textarea placeholder="Add details..." value={expense.description}
                            onChange={(e) => setExpense({...expense, description: e.target.value})} />
                    </div>

                    <button type="submit" className="submit-btn">Save Expense</button>
                </form>
            </div>
        </div>
    );
}

export default ExpenseManager;