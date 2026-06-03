import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../App.css';

const INITIAL_CATS = [
  { categoryID: 1, categoryName: 'Food',          description: 'Groceries, takeaways and meals' },
  { categoryID: 2, categoryName: 'Transport',     description: 'Taxi, bus and fuel costs' },
  { categoryID: 3, categoryName: 'Rent',          description: 'Monthly accommodation payments' },
  { categoryID: 4, categoryName: 'Stationery',    description: 'Books, pens and study materials' },
  { categoryID: 5, categoryName: 'Entertainment', description: 'Streaming, outings and hobbies' },
  { categoryID: 6, categoryName: 'Data',          description: 'Mobile data and internet' },
];
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
function Reports({ users = [], currentUser = {} }) {

  const csvEscape = value => `"${String(value ?? '').replace(/"/g, '""')}"`;

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  // Read expenses & budgets from localStorage (same keys other pages save to)
  const [expenses, setExpenses] = useState(() => {
    try { const s = localStorage.getItem('ss_expenses'); return s ? JSON.parse(s) : INITIAL_EXPENSES; }
    catch { return INITIAL_EXPENSES; }
  });

  const [categories] = useState(() => {
    try { const s = localStorage.getItem('ss_categories'); return s ? JSON.parse(s) : INITIAL_CATS; }
    catch { return INITIAL_CATS; }
  });

  const catMap = categories.reduce((acc, cat) => {
    acc[cat.categoryID] = cat.categoryName;
    return acc;
  }, {});

  const [budgets, setBudgets] = useState(() => {
    try { const s = localStorage.getItem('ss_budgets'); return s ? JSON.parse(s) : INITIAL_BUDGETS; }
    catch { return INITIAL_BUDGETS; }
  });

  // Re-read expenses & budgets whenever the page mounts (picks up changes from other pages)
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const e = localStorage.getItem('ss_expenses');
        const b = localStorage.getItem('ss_budgets');
        if (e) setExpenses(JSON.parse(e));
        if (b) setBudgets(JSON.parse(b));
      } catch {}
    };

    // Listen for storage changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Also check on mount
    handleStorageChange();

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Additional listener specifically for budget changes to ensure immediate refresh
  useEffect(() => {
    const handleBudgetChange = () => {
      try {
        const b = localStorage.getItem('ss_budgets');
        if (b) setBudgets(JSON.parse(b));
      } catch {}
    };

    window.addEventListener('storage', handleBudgetChange);
    window.addEventListener('budgetChange', handleBudgetChange);
    handleBudgetChange();

    return () => {
      window.removeEventListener('storage', handleBudgetChange);
      window.removeEventListener('budgetChange', handleBudgetChange);
    };
  }, []);

  const [filterStudent, setFilterStudent] = useState('all');
  const [filterCat,     setFilterCat]     = useState('all');

  const isAdmin = currentUser.role === 'admin';
  const scopedExpenses = isAdmin
    ? expenses
    : expenses.filter(expense => expense.userID === currentUser.userID);
  const scopedBudgets = isAdmin
    ? budgets
    : budgets.filter(budget => budget.userID === currentUser.userID);
  const activeStudentFilter = isAdmin ? filterStudent : String(currentUser.userID);

  // Helper: get username from live users list
  const getName = (id) => {
    const found = users.find(u => u.userID === id);
    return found ? found.username : `User #${id}`;
  };

  // Filter expenses
  const filtered = scopedExpenses.filter(e =>
    (activeStudentFilter === 'all' || e.userID === parseInt(activeStudentFilter)) &&
    (filterCat     === 'all' || e.categoryID === parseInt(filterCat))
  );

  // Stats
  const filteredBudgets = scopedBudgets.filter(budget =>
    filterCat === 'all' || budget.categoryID === parseInt(filterCat)
  );
  const totalSpent    = filtered.reduce((s, e) => s + e.amount, 0);
  const totalBudgeted = filteredBudgets.reduce((s, b) => s + b.amount, 0);
  const highest       = filtered.length ? Math.max(...filtered.map(e => e.amount)) : 0;
  const remaining     = totalBudgeted - totalSpent;

  // Calculate budget vs actual by category
  const budgetVsActual = categories.map(cat => {
    const catBudget = filteredBudgets
      .filter(b => b.categoryID === cat.categoryID)
      .reduce((sum, b) => sum + b.amount, 0);
    const catSpent = filtered
      .filter(e => e.categoryID === cat.categoryID)
      .reduce((sum, e) => sum + e.amount, 0);
    const overspent = catSpent > catBudget && catBudget > 0 ? catSpent - catBudget : 0;
    return {
      id: cat.categoryID,
      name: cat.categoryName,
      budget: catBudget,
      spent: catSpent,
      overspent,
      isOverspent: overspent > 0
    };
  }).filter(c => c.budget > 0 || c.spent > 0);

  // Spending by category (bar chart)
  const byCat = categories.map(cat => {
    const spent = filtered
      .filter(e => e.categoryID === cat.categoryID)
      .reduce((s, e) => s + e.amount, 0);
    return { id: cat.categoryID, name: cat.categoryName, spent };
  }).filter(c => c.spent > 0);
  const maxSpent = byCat.length ? Math.max(...byCat.map(c => c.spent)) : 1;

  // Spending by student — uses LIVE users list so new users appear
  const reportUsers = isAdmin ? users : users.filter(user => user.userID === currentUser.userID);
  const byStudent = reportUsers.map(u => {
    const spent = filtered
      .filter(e => e.userID === u.userID)
      .reduce((s, e) => s + e.amount, 0);
    const budget = filteredBudgets
      .filter(b => b.userID === u.userID)
      .reduce((s, b) => s + b.amount, 0);
    return { id: u.userID, name: u.username, spent, budget };
  }).filter(s => s.spent > 0 || s.budget > 0);

  const exportSummary = {
    totalSpent: expenses.reduce((sum, expense) => sum + expense.amount, 0),
    totalBudgeted: budgets.reduce((sum, budget) => sum + budget.amount, 0),
    highestExpense: expenses.length ? Math.max(...expenses.map(expense => expense.amount)) : 0,
    totalRecords: expenses.length,
    studentCount: new Set(expenses.map(expense => expense.userID)).size,
  };

  const exportRemaining = exportSummary.totalBudgeted - exportSummary.totalSpent;

  const handleExportCSV = () => {
    const generatedAt = new Date().toISOString();

    const summaryLines = [
      'Summary',
      'Metric,Value',
      `${csvEscape('Total Spent')},${csvEscape(`R ${exportSummary.totalSpent.toFixed(2)}`)}`,
      `${csvEscape('Total Budgeted')},${csvEscape(`R ${exportSummary.totalBudgeted.toFixed(2)}`)}`,
      `${csvEscape('Budget Remaining')},${csvEscape(`R ${Math.abs(exportRemaining).toFixed(2)}${exportRemaining < 0 ? ' OVER' : ''}`)}`,
      `${csvEscape('Highest Expense')},${csvEscape(`R ${exportSummary.highestExpense.toFixed(2)}`)}`,
      `${csvEscape('Total Records')},${csvEscape(exportSummary.totalRecords)}`,
      ...(isAdmin ? [`${csvEscape('Students')},${csvEscape(exportSummary.studentCount)}`] : []),
      '',
    ];

    const expenseLines = [
      'Expense Records',
      'ID,Student,Category,Amount,Description,Date',
      ...filtered.map(expense => [
        csvEscape(expense.expenseID),
        csvEscape(getName(expense.userID)),
        csvEscape(catMap[expense.categoryID] || 'Unknown'),
        csvEscape(expense.amount.toFixed(2)),
        csvEscape(expense.description),
        csvEscape(expense.expenseDate),
      ].join(',')),
      '',
    ];

    const budgetLines = [
      'Budget Records',
      'Student,Category,Amount',
      ...filteredBudgets.map(budget => [
        csvEscape(getName(budget.userID)),
        csvEscape(catMap[budget.categoryID] || 'Unknown'),
        csvEscape(budget.amount.toFixed(2)),
      ].join(',')),
    ];

    const csv = [
      'SpendSmart Report Export',
      `Generated At,${csvEscape(generatedAt)}`,
      '',
      ...summaryLines,
      ...expenseLines,
      ...budgetLines,
    ].join('\n');

    downloadFile(csv, 'spendsmart-report.csv', 'text/csv;charset=utf-8;');
  };

  const handleExportPDF = () => {
    if (!isAdmin) {
      return;
    }

    const generatedAt = new Date().toLocaleString();
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('SpendSmart Report Export', 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated: ${generatedAt}`, 14, 25);

    autoTable(doc, {
      startY: 32,
      head: [['Metric', 'Value']],
      body: [
        ['Total Spent', `R ${exportSummary.totalSpent.toFixed(2)}`],
        ['Total Budgeted', `R ${exportSummary.totalBudgeted.toFixed(2)}`],
        ['Budget Remaining', `R ${Math.abs(exportRemaining).toFixed(2)}${exportRemaining < 0 ? ' OVER' : ''}`],
        ['Highest Expense', `R ${exportSummary.highestExpense.toFixed(2)}`],
        ['Total Records', String(exportSummary.totalRecords)],
        ...(isAdmin ? [['Students', String(exportSummary.studentCount)]] : []),
      ],
    });

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 32) + 10,
      head: [['ID', 'Student', 'Category', 'Amount', 'Description', 'Date']],
      body: filtered.map(expense => [
        String(expense.expenseID),
        getName(expense.userID),
        catMap[expense.categoryID] || 'Unknown',
        `R ${expense.amount.toFixed(2)}`,
        expense.description,
        expense.expenseDate,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [108, 63, 197] },
    });

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 32) + 10,
      head: [['Student', 'Category', 'Amount']],
      body: filteredBudgets.map(budget => [
        getName(budget.userID),
        catMap[budget.categoryID] || 'Unknown',
        `R ${budget.amount.toFixed(2)}`,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [108, 63, 197] },
    });

    doc.save('spendsmart-report.pdf');
  };

  return (
    <main>
      <div className="page-hero">
        <h1>Expense <em>Reports</em></h1>
        <p>{isAdmin ? 'Live summary of all student spending and budgets' : 'Your personal spending and budget summary'}</p>
      </div>

      {/* ── STATS ── */}
      <div className="stats" style={{ gridTemplateColumns: isAdmin ? 'repeat(6,1fr)' : 'repeat(5,1fr)' }}>
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
          <div className="stat-value">{filtered.length}</div>
        </div>
        {isAdmin && <div className="stat">
          <div className="stat-label">Students</div>
          <div className="stat-value">{users.length}</div>
        </div>}
      </div>

      {/* ── FILTERS ── */}
      <div className="card" style={{ marginBottom:24 }}>
        <div className="report-toolbar">
          <div className="card-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
            {isAdmin ? 'Filter Report' : 'Your Report'}
          </div>
          <div className="export-actions">
            <button className="export-btn" onClick={handleExportCSV}>Export CSV</button>
            <button className="export-btn" onClick={handleExportPDF}>Export PDF</button>
          </div>
        </div>
        {isAdmin && (
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
                {categories.map(cat => (
                  <option key={cat.categoryID} value={cat.categoryID}>{cat.categoryName}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── CHARTS ROW ── */}
      {isAdmin ? (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>
          {/* Budget vs Actual by Category */}
          <div className="card">
            <div className="card-title">Budget vs Actual by Category</div>
            {budgetVsActual.length === 0
              ? <p style={{ color:'var(--muted)', fontSize:'0.88rem' }}>No data available.</p>
              : budgetVsActual.map(c => (
                  <div key={c.id} style={{ 
                    marginBottom:14, 
                    padding:12, 
                    borderRadius:8, 
                    background: c.isOverspent ? '#fee2e2' : 'var(--bg)',
                    border: c.isOverspent ? '2px solid #dc3545' : '1px solid var(--border)'
                  }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <span style={{ fontWeight:600, color:'var(--text)', fontSize:'0.9rem' }}>{c.name}</span>
                      {c.isOverspent && (
                        <span style={{ 
                          fontSize:'0.75rem', 
                          padding:'2px 8px', 
                          borderRadius:'4px',
                          background:'#dc3545', 
                          color:'white',
                          fontWeight:700
                        }}>
                          OVERSPENT
                        </span>
                      )}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:'0.85rem' }}>
                      <div>
                        <span style={{ color:'var(--muted)' }}>Budget:</span>
                        <span style={{ fontWeight:600, marginLeft:4 }}>R {c.budget.toFixed(2)}</span>
                      </div>
                      <div>
                        <span style={{ color:'var(--muted)' }}>Spent:</span>
                        <span style={{ fontWeight:600, marginLeft:4, color: c.isOverspent ? '#dc3545' : 'inherit' }}>R {c.spent.toFixed(2)}</span>
                      </div>
                    </div>
                    {c.isOverspent && (
                      <div style={{ marginTop:8, padding:6, background:'#dc3545', borderRadius:4, fontSize:'0.8rem', color:'white', textAlign:'center', fontWeight:600 }}>
                        ⚠️ Overspent by R {c.overspent.toFixed(2)}
                      </div>
                    )}
                  </div>
                ))}
          </div>

          {/* Monthly Trends */}
          <div className="card">
            <div className="card-title">Monthly Spending Trends</div>
            <div style={{ padding:16 }}>
              <p style={{ color:'var(--muted)', fontSize:'0.88rem', marginBottom:12 }}>
                {filtered.length > 0 
                  ? `From ${new Date(filtered[0].expenseDate).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })} to ${new Date(filtered[filtered.length - 1].expenseDate).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}`
                  : 'No expense data available'
                }
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12 }}>
                <div style={{ padding:12, background:'var(--bg)', borderRadius:8 }}>
                  <div style={{ fontSize:'0.8rem', color:'var(--muted)', marginBottom:4 }}>Total Spent</div>
                  <div style={{ fontSize:'1.2rem', fontWeight:700, color:'var(--purple)' }}>R {totalSpent.toFixed(2)}</div>
                </div>
                <div style={{ padding:12, background:'var(--bg)', borderRadius:8 }}>
                  <div style={{ fontSize:'0.8rem', color:'var(--muted)', marginBottom:4 }}>Avg per Student</div>
                  <div style={{ fontSize:'1.2rem', fontWeight:700, color:'var(--purple)' }}>R {(totalSpent / users.length).toFixed(2)}</div>
                </div>
                <div style={{ padding:12, background:'var(--bg)', borderRadius:8 }}>
                  <div style={{ fontSize:'0.8rem', color:'var(--muted)', marginBottom:4 }}>Most Common Category</div>
                  <div style={{ fontSize:'1rem', fontWeight:700, color:'var(--text)' }}>
                    {byCat.length > 0 ? byCat.sort((a, b) => b.spent - a.spent)[0].name : 'N/A'}
                  </div>
                </div>
                <div style={{ padding:12, background:'var(--bg)', borderRadius:8 }}>
                  <div style={{ fontSize:'0.8rem', color:'var(--muted)', marginBottom:4 }}>Budget Utilization</div>
                  <div style={{ fontSize:'1rem', fontWeight:700, color:remaining >= 0 ? '#28a745' : '#e11d48' }}>
                    {totalBudgeted > 0 ? `${((totalSpent / totalBudgeted) * 100).toFixed(0)}%` : 'N/A'}
                  </div>
                </div>
              </div>
              
              {/* Recommendations based on trends */}
              <div style={{ marginTop:16, padding:12, background:'#f0fdf4', borderRadius:8, border:'1px solid #22c55e' }}>
                <div style={{ fontSize:'0.9rem', fontWeight:700, color:'#166534', marginBottom:8 }}>💡 Recommendations</div>
                <ul style={{ margin:0, paddingLeft:20, fontSize:'0.85rem', color:'#166534', lineHeight:'1.5' }}>
                  {remaining < 0 && <li>Overall spending exceeds budget by R {Math.abs(remaining).toFixed(2)}. Consider reviewing controllable categories like Data and Transport.</li>}
                  {byCat.length > 0 && byCat.filter(c => {
                    const catBudget = filteredBudgets.filter(b => b.categoryID === c.id).reduce((sum, b) => sum + b.amount, 0);
                    return c.spent > catBudget && catBudget > 0;
                  }).length > 0 && <li>Some categories are overspent. Focus on reducing spending in the top overspending categories listed above.</li>}
                  {totalBudgeted > 0 && (totalSpent / totalBudgeted) > 0.9 && <li>Budget utilization is high. Consider setting aside emergency funds for unexpected expenses.</li>}
                  {byCat.length > 0 && <li>Top spending category is {byCat.sort((a, b) => b.spent - a.spent)[0].name}. Review if this aligns with your priorities.</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>
          {/* Budget vs Actual by Category */}
          <div className="card">
            <div className="card-title">Budget vs Actual by Category</div>
            {budgetVsActual.length === 0
              ? <p style={{ color:'var(--muted)', fontSize:'0.88rem' }}>No data available.</p>
              : budgetVsActual.map(c => (
                  <div key={c.id} style={{ 
                    marginBottom:14, 
                    padding:12, 
                    borderRadius:8, 
                    background: c.isOverspent ? '#fee2e2' : 'var(--bg)',
                    border: c.isOverspent ? '2px solid #dc3545' : '1px solid var(--border)'
                  }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <span style={{ fontWeight:600, color:'var(--text)', fontSize:'0.9rem' }}>{c.name}</span>
                      {c.isOverspent && (
                        <span style={{ 
                          fontSize:'0.75rem', 
                          padding:'2px 8px', 
                          borderRadius:'4px',
                          background:'#dc3545', 
                          color:'white',
                          fontWeight:700
                        }}>
                          OVERSPENT
                        </span>
                      )}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:'0.85rem' }}>
                      <div>
                        <span style={{ color:'var(--muted)' }}>Budget:</span>
                        <span style={{ fontWeight:600, marginLeft:4 }}>R {c.budget.toFixed(2)}</span>
                      </div>
                      <div>
                        <span style={{ color:'var(--muted)' }}>Spent:</span>
                        <span style={{ fontWeight:600, marginLeft:4, color: c.isOverspent ? '#dc3545' : 'inherit' }}>R {c.spent.toFixed(2)}</span>
                      </div>
                    </div>
                    {c.isOverspent && (
                      <div style={{ marginTop:8, padding:6, background:'#dc3545', borderRadius:4, fontSize:'0.8rem', color:'white', textAlign:'center', fontWeight:600 }}>
                        ⚠️ Overspent by R {c.overspent.toFixed(2)}
                      </div>
                    )}
                  </div>
                ))}
          </div>

          {/* Budget vs Actual per Student */}
          <div className="card">
            <div className="card-title">Budget vs Actual</div>
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
      )}

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
                  <th>ID</th>{isAdmin && <th>Student</th>}<th>Category</th>
                  <th>Amount</th><th>Description</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.expenseID}>
                    <td className="id-cell">#{e.expenseID}</td>
                    {isAdmin && <td><strong>{getName(e.userID)}</strong></td>}
                    <td><span className="cat-pill">{catMap[e.categoryID] || 'Unknown'}</span></td>
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
