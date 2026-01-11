import React, { useState } from 'react';
import API from '../../../api';
import './ExpenseStyles.css';

function ExpenseManager() {
    // 1. Updated state to include all DB columns
    const [expense, setExpense] = useState({ 
        title: '', 
        amount: '', 
        category: 'Maintenance',
        description: '',
        spent_date: '' 
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 2. Fixed: Changed 'formData' to 'expense' to match your state
        const expenseData = {
            title: expense.title,
            category: expense.category,
            amount: expense.amount,
            description: expense.description,
            spent_date: expense.spent_date
        };

        try {
            const res = await API.post('/api/admin/expenses', expenseData);
            alert(res.data.message);
            // Reset form after success
            setExpense({ title: '', amount: '', category: 'Maintenance', description: '', spent_date: '' });
        } catch (err) {
            console.error("Frontend Error:", err.response?.data); 
            alert("❌ Error saving expense. Check if all fields are filled.");
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

                    {/* 3. Added Missing Fields to match DB */}
                    <div className="input-group">
                        <label>Spent Date</label>
                        <input type="date" value={expense.spent_date}
                         max={today}
                            onChange={(e) => setExpense({...expense, spent_date: e.target.value})} required />
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