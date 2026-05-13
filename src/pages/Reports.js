import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockExpenses, mockUsers, mockCategories, mockBudgets } from '../data/mockData';
import '../App.css';

const cats = { 1: 'Food', 2: 'Transport', 3: 'Rent', 4: 'Stationery', 5: 'Entertainment', 6: 'Data' };
const studs = Object.fromEntries(mockUsers.map(u => [u.userID, u.username]));

function Reports() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';

  const [filterUser, setFilterUser] = useState(isAdmin ? 'all' : String(user.userID));
  const [filterCat, setFilterCat] = useState('all');
  const [filterFrom, setFilterFrom] = useState('2026-04-01');
  const [filterTo, setFilterTo] = useState('2026-04-30');
  const [activeTab, setActiveTab] = useState('expenses');
  const [errors, setErrors] = useState({});

  const validateFilters = () => {
    const e = {};
    if (!filterFrom) e.filterFrom = 'Start date is required.';
    if (!filterTo) e.filterTo = 'End date is required.';
    if (filterFrom && filterTo && filterFrom > filterTo) e.filterTo = 'End date must be after start date.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const filtered = useMemo(() => {
    if (!validateFilters()) return [];
    return mockExpenses.filter(e => {
      const matchUser = filterUser === 'all' || e.userID === parseInt(filterUser);
      const matchCat = filterCat === 'all' || e.categoryID === parseInt(filterCat);
      const matchFrom = !filterFrom || e.expenseDate >= filterFrom;
      const matchTo = !filterTo || e.expenseDate <= filterTo;
      return matchUser && matchCat && matchFrom && matchTo;
    });
  }, [filterUser, filterCat, filterFrom, filterTo]);

  const totalAmt = filtered.reduce((s, e) => s + e.amount, 0);
  const highest = filtered.length > 0 ? Math.max(...filtered.map(e => e.amount)) : 0;

  const catSummary = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      const name = cats[e.categoryID] || 'Other';
      map[name] = (map[name] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const budgetSummary = useMemo(() => {
    return mockBudgets
      .filter(b => filterUser === 'all' || b.userID === parseInt(filterUser))
      .map(b => {
        const spent = mockExpenses
          .filter(e => e.userID === b.userID && e.categoryID === b.categoryID)
          .reduce((s, e) => s + e.amount, 0);
        return { ...b, spent, remaining: b.amount - spent };
      });
  }, [filterUser]);

  const exportCSV = () => {
    const headers = ['ID', 'Student', 'Category', 'Amount', 'Description', 'Date'];
    const rows = filtered.map(e => [
      e.expenseID, studs[e.userID], cats[e.categoryID],
      `R${e.amount.toFixed(2)}`, e.description, e.expenseDate
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = 'spendsmart_report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const win = window.open('', '_blank');
    const rows = filtered.map(e => `
      <tr>
        <td>#${e.expenseID}</td>
        <td>${studs[e.userID]}</td>
        <td>${cats[e.categoryID]}</td>
        <td>R${e.amount.toFixed(2)}</td>
        <td>${e.description}</td>
        <td>${e.expenseDate}</td>
      </tr>`).join('');
    win.document.write(`
      <html><head><title>SpendSmart Report</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;color:#1a1025}
        h1{color:#3d1f8a;font-size:1.5rem}
        p{color:#7a6f8e;font-size:0.9rem;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;font-size:0.85rem}
        th{background:#ede8fb;color:#3d1f8a;padding:8px 12px;text-align:left}
        td{padding:8px 12px;border-bottom:1px solid #e4ddf7}
        .total{font-weight:bold;color:#3d1f8a;margin-top:16px;font-size:1rem}
      </style></head><body>
      <h1>SpendSmart — Expense Report</h1>
      <p>Generated: ${new Date().toLocaleDateString()} | Period: ${filterFrom} to ${filterTo}</p>
      <table>
        <thead><tr><th>ID</th><th>Student</th><th>Category</th><th>Amount</th><th>Description</th><th>Date</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="total">Total: R${totalAmt.toFixed(2)} | Records: ${filtered.length}</p>
      <script>window.print();</script>
      </body></html>`);
    win.document.close();
  };

  return (
    <main>
      <div className="page-hero">
        <h1>Expense <em>Reports</em></h1>
        <p>{isAdmin ? 'System-wide spending overview and analysis' : 'Your personal spending overview'}</p>
      </div>

      <div className="stats" style={{ marginBottom: '24px' }}>
        <div className="stat">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value"><span>R</span>{totalAmt.toFixed(2)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Total Records</div>
          <div className="stat-value">{filtered.length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Highest Expense</div>
          <div className="stat-value"><span>R</span>{highest.toFixed(2)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Students Tracked</div>
          <div className="stat-value">{isAdmin ? mockUsers.filter(u => u.role === 'student').length : 1}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-title">Filters</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          {isAdmin && (
            <div className="field" style={{ margin: 0 }}>
              <label>Student</label>
              <select value={filterUser} onChange={e => setFilterUser(e.target.value)}>
                <option value="all">All Students</option>
                {mockUsers.filter(u => u.role === 'student').map(u => (
                  <option key={u.userID} value={u.userID}>{u.username}</option>
                ))}
              </select>
            </div>
          )}
          <div className="field" style={{ margin: 0 }}>
            <label>Category</label>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="all">All Categories</option>
              {mockCategories.map(c => (
                <option key={c.categoryID} value={c.categoryID}>{c.categoryName}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>From Date</label>
            <input type="date" value={filterFrom} onChange={e => { setFilterFrom(e.target.value); setErrors(prev => ({ ...prev, filterFrom: '' })); }}
              className={errors.filterFrom ? 'input-error' : ''} />
            {errors.filterFrom && <span className="field-error">{errors.filterFrom}</span>}
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>To Date</label>
            <input type="date" value={filterTo} onChange={e => { setFilterTo(e.target.value); setErrors(prev => ({ ...prev, filterTo: '' })); }}
              className={errors.filterTo ? 'input-error' : ''} />
            {errors.filterTo && <span className="field-error">{errors.filterTo}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button className="btn" style={{ width: 'auto', padding: '10px 20px' }} onClick={exportCSV}>
            Export CSV
          </button>
          <button className="btn" style={{ width: 'auto', padding: '10px 20px', background: 'var(--purple-dark)' }} onClick={exportPDF}>
            Export PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['expenses', 'by-category', 'budget-vs-actual'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 18px', borderRadius: '8px', border: '1.5px solid',
              borderColor: activeTab === tab ? 'var(--purple)' : 'var(--border)',
              background: activeTab === tab ? 'var(--purple)' : 'white',
              color: activeTab === tab ? 'white' : 'var(--muted)',
              fontFamily: 'var(--sans)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer'
            }}>
            {tab === 'expenses' ? 'All Expenses' : tab === 'by-category' ? 'By Category' : 'Budget vs Actual'}
          </button>
        ))}
      </div>

      {activeTab === 'expenses' && (
        <div className="card">
          <div className="card-title">All Expense Records</div>
          <div className="table-top">
            <span className="badge-count">{filtered.length} records</span>
          </div>
          {filtered.length === 0 ? (
            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '32px', fontSize: '0.88rem' }}>
              No expenses match the selected filters.
            </p>
          ) : (
            <table>
              <thead>
                <tr><th>ID</th><th>Student</th><th>Category</th><th>Amount</th><th>Description</th><th>Date</th></tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.expenseID}>
                    <td className="id-cell">#{e.expenseID}</td>
                    <td><strong>{studs[e.userID]}</strong></td>
                    <td><span className="cat-pill">{cats[e.categoryID]}</span></td>
                    <td className="amount-cell">R {e.amount.toFixed(2)}</td>
                    <td>{e.description}</td>
                    <td>{e.expenseDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'by-category' && (
        <div className="card">
          <div className="card-title">Spending by Category</div>
          <table>
            <thead>
              <tr><th>Category</th><th>Total Spent</th><th>% of Total</th></tr>
            </thead>
            <tbody>
              {catSummary.map(([name, amt]) => (
                <tr key={name}>
                  <td><span className="cat-pill">{name}</span></td>
                  <td className="amount-cell">R {amt.toFixed(2)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, background: 'var(--purple-light)', borderRadius: '4px', height: '8px' }}>
                        <div style={{ width: `${totalAmt > 0 ? (amt / totalAmt * 100).toFixed(0) : 0}%`, background: 'var(--purple)', height: '8px', borderRadius: '4px' }} />
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)', minWidth: '36px' }}>
                        {totalAmt > 0 ? (amt / totalAmt * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'budget-vs-actual' && (
        <div className="card">
          <div className="card-title">Budget vs Actual Spending</div>
          <table>
            <thead>
              <tr><th>Student</th><th>Category</th><th>Budget</th><th>Spent</th><th>Remaining</th><th>Status</th></tr>
            </thead>
            <tbody>
              {budgetSummary.map(b => (
                <tr key={b.budgetID}>
                  <td>{studs[b.userID]}</td>
                  <td><span className="cat-pill">{cats[b.categoryID]}</span></td>
                  <td>R {b.amount.toFixed(2)}</td>
                  <td className="amount-cell">R {b.spent.toFixed(2)}</td>
                  <td style={{ color: b.remaining < 0 ? '#e74c3c' : '#2ecc71', fontWeight: 700 }}>
                    R {b.remaining.toFixed(2)}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
                      fontSize: '0.72rem', fontWeight: 600,
                      background: b.remaining < 0 ? '#fdf0f0' : '#edfaf3',
                      color: b.remaining < 0 ? '#e74c3c' : '#2ecc71',
                      border: `1px solid ${b.remaining < 0 ? '#fcc' : '#a3e6c3'}`
                    }}>
                      {b.remaining < 0 ? 'Over budget' : 'On track'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default Reports;