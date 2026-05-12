import React, { useState, useEffect } from 'react';
import '../App.css';

const CATS = { 1:'Food', 2:'Transport', 3:'Rent', 4:'Stationery', 5:'Entertainment', 6:'Data' };
const CAT_COLORS = { 1:'#6c3fc5', 2:'#2196F3', 3:'#E91E63', 4:'#FF9800', 5:'#4CAF50', 6:'#00BCD4' };

const INITIAL_EXPENSES = [
  { expenseID:1,  userID:1, categoryID:1, amount:250.00,  description:'Groceries at Pick n Pay',    expenseDate:'2026-04-01' },
  { expenseID:2,  userID:1, categoryID:2, amount:80.00,   description:'Taxi to campus',             expenseDate:'2026-04-02' },
  { expenseID:3,  userID:2, categoryID:3, amount:3500.00, description:'Monthly rent payment',       expenseDate:'2026-04-01' },
  { expenseID:4,  userID:2, categoryID:4, amount:450.00,  description:'Textbooks for semester',     expenseDate:'2026-04-03' },
  { expenseID:5,  userID:3, categoryID:5, amount:99.00,   description:'Netflix subscription',       expenseDate:'2026-04-04' },
  { expenseID:6,  userID:3, categoryID:6, amount:150.00,  description:'Monthly data bundle',        expenseDate:'2026-04-01' },
  { expenseID:7,  userID:4, categoryID:1, amount:320.00,  description:'Weekly groceries',           expenseDate:'2026-04-05' },
  { expenseID:8,  userID:4, categoryID:2, amount:60.00,   description:'Bus fare for the week',      expenseDate:'2026-04-05' },
  { expenseID:9,  userID:5, categoryID:4, amount:200.00,  description:'Stationery for assignments', expenseDate:'2026-04-06' },
  { expenseID:10, userID:5, categoryID:1, amount:180.00,  description:'Takeaways',                  expenseDate:'2026-04-07' },
];

const INITIAL_BUDGETS = [
  { userID:1, categoryID:1, amount:1000 }, { userID:1, categoryID:2, amount:400  },
  { userID:2, categoryID:3, amount:4000 }, { userID:2, categoryID:4, amount:500  },
  { userID:3, categoryID:5, amount:200  }, { userID:3, categoryID:6, amount:200  },
  { userID:4, categoryID:1, amount:1200 }, { userID:5, categoryID:2, amount:300  },
];

// users prop = live list from App.js (includes newly added users)
function Reports({ users = [] }) {

  // Read expenses & budgets from localStorage (same keys other pages save to)
  const [expenses, setExpenses] = useState(() => {
    try { const s = localStorage.getItem('ss_expenses'); return s ? JSON.parse(s) : INITIAL_EXPENSES; }
    catch { return INITIAL_EXPENSES; }
  });

  const [budgets, setBudgets] = useState(() => {
    try { const s = localStorage.getItem('ss_budgets'); return s ? JSON.parse(s) : INITIAL_BUDGETS; }
    catch { return INITIAL_BUDGETS; }
  });

  // Re-read expenses & budgets whenever the page mounts (picks up changes from other pages)
  useEffect(() => {
    try {
      const e = localStorage.getItem('ss_expenses');
      const b = localStorage.getItem('ss_budgets');
      if (e) setExpenses(JSON.parse(e));
      if (b) setBudgets(JSON.parse(b));
    } catch {}
  }, []);

  const [filterStudent, setFilterStudent] = useState('all');
  const [filterCat,     setFilterCat]     = useState('all');

  // Helper: get username from live users list
  const getName = (id) => {
    const found = users.find(u => u.userID === id);
    return found ? found.username : `User #${id}`;
  };

  // Filter expenses
  const filtered = expenses.filter(e =>
    (filterStudent === 'all' || e.userID === parseInt(filterStudent)) &&
    (filterCat     === 'all' || e.categoryID === parseInt(filterCat))
  );

  // Stats
  const totalSpent    = filtered.reduce((s, e) => s + e.amount, 0);
  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const highest       = filtered.length ? Math.max(...filtered.map(e => e.amount)) : 0;
  const average       = filtered.length ? totalSpent / filtered.length : 0;
  const remaining     = totalBudgeted - totalSpent;

  // Spending by category (bar chart)
  const byCat = Object.entries(CATS).map(([id, name]) => {
    const spent = filtered
      .filter(e => e.categoryID === parseInt(id))
      .reduce((s, e) => s + e.amount, 0);
    return { id: parseInt(id), name, spent };
  }).filter(c => c.spent > 0);
  const maxSpent = byCat.length ? Math.max(...byCat.map(c => c.spent)) : 1;

  // Spending by student — uses LIVE users list so new users appear
  const byStudent = users.map(u => {
    const spent = filtered
      .filter(e => e.userID === u.userID)
      .reduce((s, e) => s + e.amount, 0);
    const budget = budgets
      .filter(b => b.userID === u.userID)
      .reduce((s, b) => s + b.amount, 0);
    return { id: u.userID, name: u.username, spent, budget };
  }).filter(s => s.spent > 0 || s.budget > 0);

  return (
    <main>
      <div className="page-hero">
        <h1>Expense <em>Reports</em></h1>
        <p>Live summary of all student spending and budgets</p>
      </div>

      {/* ── STATS ── */}
      <div className="stats">
        <div className="stat">
          <div className="stat-label">Total Spent</div>
          <div className="stat-value"><span>R</span>{totalSpent.toLocaleString('en-ZA', { minimumFractionDigits:2 })}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Total Budgeted</div>
          <div className="stat-value"><span>R</span>{totalBudgeted.toLocaleString()}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Budget Remaining</div>
          <div className="stat-value" style={{ color: remaining >= 0 ? 'var(--purple)' : '#e11d48' }}>
            <span>R</span>{Math.abs(remaining).toLocaleString()}
            {remaining < 0 && <span style={{ fontSize:'12px', marginLeft:4, color:'#e11d48' }}>OVER</span>}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Highest Expense</div>
          <div className="stat-value"><span>R</span>{highest.toLocaleString()}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Total Records</div>
          <div className="stat-value">{expenses.length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Students</div>
          <div className="stat-value">{users.length}</div>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="card" style={{ marginBottom:24 }}>
        <div className="card-title">Filter Report</div>
        <div className="row2">
          <div className="field"><label>Filter by Student</label>
            <select value={filterStudent} onChange={e => setFilterStudent(e.target.value)}>
              <option value="all">All Students</option>
              {users.map(u => (
                <option key={u.userID} value={u.userID}>{u.username}</option>
              ))}
            </select>
          </div>
          <div className="field"><label>Filter by Category</label>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="all">All Categories</option>
              {Object.entries(CATS).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── CHARTS ROW ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>

        {/* Spending by Category */}
        <div className="card">
          <div className="card-title">Spending by Category</div>
          {byCat.length === 0
            ? <p style={{ color:'var(--muted)', fontSize:'0.88rem' }}>No data for selected filters.</p>
            : byCat.map(c => (
              <div key={c.id} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', marginBottom:5 }}>
                  <span style={{ fontWeight:600, color:'var(--text)' }}>{c.name}</span>
                  <span style={{ color:'var(--purple)', fontWeight:700 }}>R {c.spent.toFixed(2)}</span>
                </div>
                <div style={{ height:10, borderRadius:99, background:'var(--purple-light)', overflow:'hidden' }}>
                  <div style={{
                    height:'100%', borderRadius:99,
                    background: CAT_COLORS[c.id] || 'var(--purple)',
                    width:`${(c.spent / maxSpent) * 100}%`,
                    transition:'width 0.6s ease'
                  }} />
                </div>
              </div>
            ))
          }
        </div>

        {/* Budget vs Actual per Student */}
        <div className="card">
          <div className="card-title">Budget vs Actual — Per Student</div>
          {byStudent.length === 0
            ? <p style={{ color:'var(--muted)', fontSize:'0.88rem' }}>No data available.</p>
            : <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Budgeted</th>
                    <th>Spent</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {byStudent.sort((a, b) => b.spent - a.spent).map(s => {
                    const over = s.spent > s.budget && s.budget > 0;
                    const pct  = s.budget > 0 ? Math.min((s.spent / s.budget) * 100, 100) : 0;
                    return (
                      <tr key={s.id}>
                        <td><strong>{s.name}</strong></td>
                        <td className="amount-cell">R {s.budget.toFixed(2)}</td>
                        <td className="amount-cell" style={{ color: over ? '#e11d48' : 'inherit' }}>
                          R {s.spent.toFixed(2)}
                        </td>
                        <td>
                          {s.budget === 0
                            ? <span className="role-pill" style={{ background:'#f3f4f6', color:'#6b7280' }}>No budget</span>
                            : over
                              ? <span className="role-pill" style={{ background:'#fee2e2', color:'#991b1b' }}>Over budget</span>
                              : <span className="role-pill" style={{ background:'#dcfce7', color:'#166534' }}>{Math.round(pct)}% used</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          }
        </div>
      </div>

      {/* ── FULL EXPENSE TABLE ── */}
      <div className="card">
        <div className="card-title">All Expense Records</div>
        <div className="table-top">
          <span className="badge-count">{filtered.length} records</span>
          <span style={{ fontSize:'0.8rem', color:'var(--muted)' }}>
            Total: <strong style={{ color:'var(--purple-dark)' }}>R {totalSpent.toFixed(2)}</strong>
          </span>
        </div>
        {filtered.length === 0
          ? <p style={{ color:'var(--muted)', fontSize:'0.88rem', padding:'16px 0' }}>
              No records match the selected filters.
            </p>
          : <table>
              <thead>
                <tr>
                  <th>ID</th><th>Student</th><th>Category</th>
                  <th>Amount</th><th>Description</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.expenseID}>
                    <td className="id-cell">#{e.expenseID}</td>
                    <td><strong>{getName(e.userID)}</strong></td>
                    <td><span className="cat-pill">{CATS[e.categoryID]}</span></td>
                    <td className="amount-cell">R {parseFloat(e.amount).toFixed(2)}</td>
                    <td style={{ fontSize:'0.82rem', color:'var(--muted)' }}>{e.description}</td>
                    <td>{e.expenseDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>
    </main>
  );
}

export default Reports;
