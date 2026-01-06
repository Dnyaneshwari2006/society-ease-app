import React, { useEffect, useState } from 'react';
import API from '../../../api';
import './ExpenseStyles.css';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

function ExpenseChart() {
    const [expenses, setExpenses] = useState([]);

    useEffect(() => {
        API.get('/api/admin/expenses') 
            .then(res => setExpenses(res.data))
            .catch(err => console.error(err));
    }, []);

    const totalSpent = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);

    // --- CHART DATA LOGIC ---
    const categories = [...new Set(expenses.map(ex => ex.category))];
    const categoryData = categories.map(cat => 
        expenses.filter(ex => ex.category === cat).reduce((sum, ex) => sum + parseFloat(ex.amount), 0)
    );

    const pieData = {
        labels: categories,
        datasets: [{
            data: categoryData,
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        }]
    };

    const barData = {
        labels: expenses.map(ex => new Date(ex.spent_date).toLocaleDateString()),
        datasets: [{
            label: 'Expense Amount (₹)',
            data: expenses.map(ex => ex.amount),
            backgroundColor: '#e74c3c',
        }]
    };

    const options = {
        maintainAspectRatio: false, 
        responsive: true,
        plugins: {
            legend: { display: true, position: 'bottom' }
        }
    };

    return (
        <div className="admin-dashboard-view">
            {/* Charts Section - Desktop par side-by-side, mobile par stacked */}
            <div className="charts-grid-container">
                <div className="chart-container-glass">
                    <h3>Expense Trends</h3>
                    <div className="chart-wrapper">
                        <Bar data={barData} options={options} />
                    </div>
                </div>
                <div className="chart-container-glass">
                    <h3>Category Breakdown</h3>
                    <div className="chart-wrapper">
                        <Pie data={pieData} options={options} />
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="table-container-glass">
                <div className="table-header">
                    <h2>Expense Summary</h2>
                    <p>Total Outflow: <strong>₹{totalSpent.toLocaleString()}</strong></p>
                </div>
                <div className="table-responsive-wrapper">
                    <table className="complaints-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Title</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.length > 0 ? expenses.map((ex) => (
                                <tr key={ex.id}>
                                    <td>{new Date(ex.spent_date).toLocaleDateString()}</td>
                                    <td><span className="role-badge admin">{ex.category}</span></td>
                                    <td>{ex.title}</td>
                                    <td style={{color: '#e74c3c', fontWeight: 'bold'}}>-₹{ex.amount}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" style={{textAlign: 'center'}}>No expenses recorded yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ExpenseChart;