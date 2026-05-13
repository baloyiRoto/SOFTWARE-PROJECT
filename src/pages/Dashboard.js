import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockExpenses, mockBudgets } from '../data/mockData';
import '../App.css';

function Dashboard() {
  const { user } = useAuth();

  const myExpenses = mockExpenses.filter(e => e.userID === user.userID);
  const myBudgets = mockBudgets.filter(b => b.userID === user.userID);
  const totalSpent = myExpenses.reduce((s, e) => s + e.amount, 0);
  const totalBudget = myBudgets.reduce((s, b) => s + b.amount, 0);
  const remaining = totalBudget - totalSpent;

  return (
    <main>
      <div className="page-hero">
        <h1>Welcome, <em>{user.username}</em></h1>
        <p>Your personal expense dashboard — {user.role} account</p>
      </div>

      <div className="stats" style={{ marginBottom: '28px' }}>
        <div className="stat">
          <div className="stat-label">My Total Spent</div>
          <div className="stat-value"><span>R</span>{totalSpent.toFixed(2)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">My Budget</div>
          <div className="stat-value"><span>R</span>{totalBudget.toFixed(2)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Remaining</div>
          <div className="stat-value" style={{ color: remaining < 0 ? '#e74c3c' : 'var(--purple-dark)' }}>
            <span>R</span>{remaining.toFixed(2)}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">My Expenses</div>
          <div className="stat-value">{myExpenses.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Link to="/expenses" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💸</div>
            <div className="card-title" style={{ marginBottom: '4px' }}>Track Expenses</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Log and view your expenses</p>
          </div>
        </Link>

        <Link to="/budgets" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</div>
            <div className="card-title" style={{ marginBottom: '4px' }}>My Budgets</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>View your budget allocations</p>
          </div>
        </Link>

        <Link to="/reports" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📈</div>
            <div className="card-title" style={{ marginBottom: '4px' }}>My Reports</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>View your spending reports</p>
          </div>
        </Link>
      </div>

      {myExpenses.length > 0 && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-title">Recent Expenses</div>
          <table>
            <thead>
              <tr><th>Description</th><th>Amount</th><th>Date</th></tr>
            </thead>
            <tbody>
              {myExpenses.slice(0, 5).map(e => (
                <tr key={e.expenseID}>
                  <td>{e.description}</td>
                  <td className="amount-cell">R {e.amount.toFixed(2)}</td>
                  <td>{e.expenseDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default Dashboard;