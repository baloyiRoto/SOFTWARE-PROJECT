import React, { useState, useEffect } from 'react';
import '../App.css';

const INITIAL_CATS = [
  { categoryID: 1, categoryName: 'Food',          description: 'Groceries, takeaways and meals' },
  { categoryID: 2, categoryName: 'Transport',     description: 'Taxi, bus and fuel costs' },
  { categoryID: 3, categoryName: 'Rent',          description: 'Monthly accommodation payments' },
  { categoryID: 4, categoryName: 'Stationery',    description: 'Books, pens and study materials' },
  { categoryID: 5, categoryName: 'Entertainment', description: 'Streaming, outings and hobbies' },
  { categoryID: 6, categoryName: 'Data',          description: 'Mobile data and internet' },
];
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
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const INITIAL_BUDGETS = [
  { budgetID:1, userID:1, categoryID:1, amount:1000.00, month:4, year:2026 },
  { budgetID:2, userID:1, categoryID:2, amount:400.00,  month:4, year:2026 },
  { budgetID:3, userID:2, categoryID:3, amount:4000.00, month:4, year:2026 },
  { budgetID:4, userID:2, categoryID:4, amount:500.00,  month:4, year:2026 },
  { budgetID:5, userID:3, categoryID:5, amount:200.00,  month:4, year:2026 },
  { budgetID:6, userID:3, categoryID:6, amount:200.00,  month:4, year:2026 },
  { budgetID:7, userID:4, categoryID:1, amount:1200.00, month:4, year:2026 },
  { budgetID:8, userID:5, categoryID:2, amount:300.00,  month:4, year:2026 },
];

// users prop comes LIVE from App.js — always up to date
function Budgets({ users = [], currentUser = {} }) {

  const [budgets, setBudgets] = useState(() => {
    try { const s = localStorage.getItem('ss_budgets'); return s ? JSON.parse(s) : INITIAL_BUDGETS; }
    catch { return INITIAL_BUDGETS; }
  });
  const [categories, setCategories] = useState(() => {
    try { const s = localStorage.getItem('ss_categories'); return s ? JSON.parse(s) : INITIAL_CATS; }
    catch { return INITIAL_CATS; }
  });
  const [expenses, setExpenses] = useState(() => {
    try { const s = localStorage.getItem('ss_expenses'); return s ? JSON.parse(s) : INITIAL_EXPENSES; }
    catch { return INITIAL_EXPENSES; }
  });
  const [nextID, setNextID] = useState(() => {
    try { const s = localStorage.getItem('ss_budgets_nid'); return s ? parseInt(s) : 9; }
    catch { return 9; }
  });

  useEffect(() => { localStorage.setItem('ss_budgets', JSON.stringify(budgets)); }, [budgets]);
  useEffect(() => { localStorage.setItem('ss_budgets_nid', String(nextID)); }, [nextID]);
  useEffect(() => { localStorage.setItem('ss_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('ss_categories', JSON.stringify(categories)); }, [categories]);

  // Re-read expenses from localStorage when component mounts or when expenses change in other pages
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const e = localStorage.getItem('ss_expenses');
        if (e) {
          const parsed = JSON.parse(e);
          console.log('Budgets: Reloading expenses from localStorage', parsed);
          setExpenses(parsed);
        }
      } catch {}
    };

    // Listen for storage changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('expenseChange', handleStorageChange);
    
    // Also check on mount
    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('expenseChange', handleStorageChange);
    };
  }, []);

  // Listen for budget changes from other pages
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

  // Listen for category changes from other pages
  useEffect(() => {
    const handleCategoryChange = () => {
      try {
        const c = localStorage.getItem('ss_categories');
        if (c) setCategories(JSON.parse(c));
      } catch {}
    };

    window.addEventListener('storage', handleCategoryChange);
    window.addEventListener('categoryChange', handleCategoryChange);
    handleCategoryChange();

    return () => {
      window.removeEventListener('storage', handleCategoryChange);
      window.removeEventListener('categoryChange', handleCategoryChange);
    };
  }, []);

  const catMap = categories.reduce((acc, cat) => {
    acc[cat.categoryID] = cat.categoryName;
    return acc;
  }, {});

  const isAdmin = currentUser?.role === 'admin';
  const visibleBudgets = isAdmin
    ? budgets
    : budgets.filter(budget => budget.userID === currentUser.userID);

  // Calculate spending for each budget
  const budgetsWithSpending = visibleBudgets.map(budget => {
    const matchingExpenses = expenses.filter(expense => 
      expense.userID === budget.userID && 
      expense.categoryID === budget.categoryID &&
      new Date(expense.expenseDate).getMonth() + 1 === budget.month &&
      new Date(expense.expenseDate).getFullYear() === budget.year
    );
    const spent = matchingExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remaining = budget.amount - spent;
    const overspent = spent > budget.amount ? spent - budget.amount : 0;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    
    return {
      ...budget,
      spent,
      remaining,
      overspent,
      percentage,
      status: overspent > 0 ? 'overspent' : remaining <= 0 ? 'exhausted' : 'active'
    };
  });

  // Calculate overspending by category
  const overspendingByCategory = categories.map(cat => {
    const categoryBudgets = budgetsWithSpending.filter(b => b.categoryID === cat.categoryID);
    const totalBudget = categoryBudgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = categoryBudgets.reduce((sum, b) => sum + b.spent, 0);
    const overspent = totalSpent > totalBudget ? totalSpent - totalBudget : 0;
    
    return {
      categoryID: cat.categoryID,
      categoryName: cat.categoryName,
      totalBudget,
      totalSpent,
      overspent,
      isOverspent: overspent > 0
    };
  }).filter(c => c.isOverspent);

  // Form state — default to first user in live list
  const currentDate = new Date();
  const [userID,     setUserID]     = useState('');
  const [categoryID, setCategoryID] = useState('1');
  const [amount,     setAmount]     = useState('');
  const [month,      setMonth]      = useState(String(currentDate.getMonth() + 1));
  const [year,       setYear]       = useState(String(currentDate.getFullYear()));
  const [editOpen,   setEditOpen]   = useState(false);
  const [editBudget, setEditBudget] = useState(null);
  const [delOpen,    setDelOpen]    = useState(false);
  const [delID,      setDelID]      = useState(null);
  const [alert,      setAlert]      = useState({ show:false, msg:'', type:'' });
  const [multiAddMode, setMultiAddMode] = useState(false);
  const [budgetEntries, setBudgetEntries] = useState([{ categoryID: '1', amount: '' }]);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [pendingBudget, setPendingBudget] = useState(null);

  const total = visibleBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  const studentCount = isAdmin
    ? new Set(visibleBudgets.map(budget => budget.userID)).size
    : 1;

  // Bind the add form to the logged-in student, or the first user for admin editing.
  useEffect(() => {
    if (!isAdmin && currentUser.userID) {
      setUserID(String(currentUser.userID));
      return;
    }

    if (users.length > 0 && !userID) setUserID(String(users[0].userID));
  }, [users, currentUser, isAdmin, userID]);

  const showAlert = (msg, type='alert-success') => {
    setAlert({ show:true, msg, type });
    setTimeout(() => setAlert({ show:false, msg:'', type:'' }), 4000);
  };

  // Lookup username by ID from live users list
  const getName = (id) => {
    const found = users.find(u => u.userID === id);
    return found ? found.username : `User #${id}`;
  };

  const addBudget = () => {
    if (!multiAddMode) {
      if (!amount || parseFloat(amount) <= 0) { showAlert('Enter a valid amount.','alert-error'); return; }
      if (!userID) { showAlert('Please select a student.','alert-error'); return; }
      
      const newB = { budgetID:nextID, userID:parseInt(userID), categoryID:parseInt(categoryID),
                     amount:parseFloat(amount), month:parseInt(month), year:parseInt(year) };
      
      // Check for duplicate budget
      const duplicate = visibleBudgets.find(b => 
        b.userID === newB.userID && 
        b.categoryID === newB.categoryID && 
        b.month === newB.month && 
        b.year === newB.year
      );
      
      if (duplicate) {
        const catName = categories.find(c => c.categoryID === newB.categoryID)?.categoryName || 'this category';
        setDuplicateWarning({
          message: `A budget for ${catName} already exists for ${newB.month}/${newB.year}. Do you want to:`,
          existing: duplicate,
          new: newB
        });
        setPendingBudget(newB);
        return;
      }
      
      setBudgets(prev => [newB, ...prev]);
      setNextID(prev => prev + 1);
      setAmount('');
      showAlert(`Budget saved for ${getName(parseInt(userID))}!`);
    } else {
      const validEntries = budgetEntries.filter(entry => entry.amount && parseFloat(entry.amount) > 0);
      if (validEntries.length === 0) { showAlert('Please enter at least one valid amount.','alert-error'); return; }
      if (!userID) { showAlert('Please select a student.','alert-error'); return; }
      
      const newBudgets = validEntries.map(entry => ({
        budgetID: nextID + validEntries.indexOf(entry),
        userID: parseInt(userID),
        categoryID: parseInt(entry.categoryID),
        amount: parseFloat(entry.amount),
        month: parseInt(month),
        year: parseInt(year)
      }));
      
      // Check for duplicates in multi-add mode
      const duplicates = newBudgets.filter(newB => 
        visibleBudgets.find(b => 
          b.userID === newB.userID && 
          b.categoryID === newB.categoryID && 
          b.month === newB.month && 
          b.year === newB.year
        )
      );
      
      if (duplicates.length > 0) {
        const duplicateNames = duplicates.map(d => {
          const catName = categories.find(c => c.categoryID === d.categoryID)?.categoryName || 'this category';
          return catName;
        }).join(', ');
        showAlert(`Duplicate budgets detected for: ${duplicateNames}. Please add them individually to manage duplicates.`, 'alert-error');
        return;
      }
      
      setBudgets(prev => [...newBudgets, ...prev]);
      setNextID(prev => prev + newBudgets.length);
      setBudgetEntries([{ categoryID: '1', amount: '' }]);
      showAlert(`${newBudgets.length} budgets saved for ${getName(parseInt(userID))}!`);
    }
  };

  const handleDuplicateDecision = (replace) => {
    if (!pendingBudget) return;
    
    if (replace) {
      // Remove the existing duplicate and add the new one
      setBudgets(prev => prev.filter(b => 
        !(b.userID === pendingBudget.userID && 
          b.categoryID === pendingBudget.categoryID && 
          b.month === pendingBudget.month && 
          b.year === pendingBudget.year)
      ));
      setBudgets(prev => [pendingBudget, ...prev]);
      setNextID(prev => prev + 1);
      showAlert(`Existing budget replaced with new budget.`);
    } else {
      // Add the new budget alongside the existing one
      setBudgets(prev => [pendingBudget, ...prev]);
      setNextID(prev => prev + 1);
      showAlert(`New budget added alongside existing budget.`);
    }
    
    setAmount('');
    setDuplicateWarning(null);
    setPendingBudget(null);
  };

  const addBudgetEntry = () => {
    setBudgetEntries([...budgetEntries, { categoryID: '1', amount: '' }]);
  };

  const removeBudgetEntry = (index) => {
    if (budgetEntries.length > 1) {
      setBudgetEntries(budgetEntries.filter((_, i) => i !== index));
    }
  };

  const updateBudgetEntry = (index, field, value) => {
    const updated = [...budgetEntries];
    updated[index][field] = value;
    setBudgetEntries(updated);
  };

  const saveEdit = () => {
    if (!editBudget.amount || parseFloat(editBudget.amount) <= 0) {
      showAlert('Valid amount required.','alert-error'); return;
    }
    setBudgets(budgets.map(b => b.budgetID === editBudget.budgetID ? editBudget : b));
    setEditOpen(false);
    showAlert('Budget updated!');
  };

  const confirmDelete = () => {
    setBudgets(budgets.filter(b => b.budgetID !== delID));
    setDelOpen(false);
    showAlert('Budget deleted.');
    
    // Dispatch custom event to notify other pages of budget change
    window.dispatchEvent(new Event('budgetChange'));
  };

  return (
    <main>
      <div className="page-hero">
        <h1>Monthly <em>Budgets</em></h1>
        <p>Set, update and remove student budget allocations</p>
      </div>
      {alert.show && <div className={`alert show ${alert.type}`}>{alert.msg}</div>}

      <div className="stats" style={{ gridTemplateColumns: isAdmin ? 'repeat(3,1fr)' : 'repeat(2,1fr)', marginBottom:28 }}>
        <div className="stat"><div className="stat-label">Total Budgeted</div>
          <div className="stat-value"><span>R</span>{total.toLocaleString()}</div></div>
        <div className="stat"><div className="stat-label">Budget Records</div>
          <div className="stat-value">{visibleBudgets.length}</div></div>
        {isAdmin && <div className="stat"><div className="stat-label">Students in System</div>
          <div className="stat-value">{studentCount}</div></div>}
      </div>

      {/* ── OVERSPENDING BREAKDOWN ── */}
      {!isAdmin && overspendingByCategory.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">⚠️ Overspending Breakdown</div>
          <div style={{ padding: 16 }}>
            {overspendingByCategory.map(cat => (
              <div key={cat.categoryID} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong>{cat.categoryName}</strong>
                  <span style={{ color: '#dc3545', fontWeight: 600 }}>Over by R {cat.overspent.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 8 }}>
                  Budgeted: R {cat.totalBudget.toFixed(2)} | Spent: R {cat.totalSpent.toFixed(2)}
                </div>
                <div style={{ padding: 12, background: '#fef3c7', borderRadius: 6, fontSize: '0.85rem', color: '#92400e' }}>
                  <strong>💡 Suggestion:</strong> {cat.categoryName === 'Data' || cat.categoryName === 'Transport' 
                    ? `Consider reducing ${cat.categoryName.toLowerCase()} usage or switching to a cheaper plan. Track your spending daily to stay within budget.`
                    : cat.categoryName === 'Food' || cat.categoryName === 'Entertainment'
                    ? `Try meal planning to reduce ${cat.categoryName.toLowerCase()} costs. Look for discounts and buy in bulk where possible.`
                    : `Review your ${cat.categoryName.toLowerCase()} expenses and identify non-essential purchases. Consider setting a weekly spending limit.`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="layout">
        {/* ── ADD FORM ── */}
        {!isAdmin && (
        <div className="card">
          <div className="card-title">
            Add Budget
            <button 
              type="button" 
              className="btn" 
              style={{ float: 'right', fontSize: '0.8rem', padding: '4px 8px' }}
              onClick={() => setMultiAddMode(!multiAddMode)}
            >
              {multiAddMode ? 'Single Mode' : 'Multi-Add Mode'}
            </button>
          </div>

          <div className="field"><label>Student</label>
            <input type="text" value={currentUser.username} disabled /></div>

          {!multiAddMode ? (
            <>
              <div className="field"><label>Category *</label>
                <select value={categoryID} onChange={e => setCategoryID(e.target.value)}>
                  {categories.map(cat => <option key={cat.categoryID} value={cat.categoryID}>{cat.categoryName}</option>)}
                </select></div>

              <div className="field"><label>Amount (R) *</label>
                <input type="number" placeholder="e.g. 1500" min="0" step="0.01"
                  value={amount} onChange={e => setAmount(e.target.value)} /></div>

              <div className="row2">
                <div className="field"><label>Month *</label>
                  <select value={month} onChange={e => setMonth(e.target.value)}>
                    {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select></div>
                <div className="field"><label>Year *</label>
                  <select value={year} onChange={e => setYear(e.target.value)}>
                    {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}</option>)}
                  </select></div>
              </div>
            </>
          ) : (
            <>
              <div className="field"><label>Month *</label>
                <select value={month} onChange={e => setMonth(e.target.value)}>
                  {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select></div>
              <div className="field"><label>Year *</label>
                <select value={year} onChange={e => setYear(e.target.value)}>
                  {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}</option>)}
                </select></div>
              
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8, display: 'block' }}>Budget Entries *</label>
                {budgetEntries.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <div className="field" style={{ flex: 1 }}>
                      <select 
                        value={entry.categoryID} 
                        onChange={e => updateBudgetEntry(index, 'categoryID', e.target.value)}
                      >
                        {categories.map(cat => <option key={cat.categoryID} value={cat.categoryID}>{cat.categoryName}</option>)}
                      </select>
                    </div>
                    <div className="field" style={{ flex: 1 }}>
                      <input 
                        type="number" 
                        placeholder="Amount (R) *" 
                        min="0" 
                        step="0.01"
                        value={entry.amount}
                        onChange={e => updateBudgetEntry(index, 'amount', e.target.value)}
                      />
                    </div>
                    <button 
                      type="button" 
                      className="del-btn"
                      onClick={() => removeBudgetEntry(index)}
                      disabled={budgetEntries.length === 1}
                      style={{ marginTop: 0 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  className="btn" 
                  onClick={addBudgetEntry}
                  style={{ fontSize: '0.8rem', padding: '6px 12px', marginTop: 8 }}
                >
                  + Add Another
                </button>
              </div>
            </>
          )}

          <button className="btn" onClick={addBudget} disabled={users.length === 0}>
            {multiAddMode ? `Add ${budgetEntries.length} Budgets` : 'Add Budget'}
          </button>
        </div>
        )}

        {/* ── TABLE ── */}
        <div className={`card ${isAdmin ? 'admin-only-full' : ''}`}>
          <div className="card-title">All Budgets</div>
          <div className="table-top"><span className="badge-count">{visibleBudgets.length} records</span></div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '800px' }}>
              <thead><tr><th>ID</th>{isAdmin && <th>Student</th>}<th>Category</th><th>Budget</th><th>Spent</th><th>Status</th><th>Month/Year</th><th>Actions</th></tr></thead>
              <tbody>
                {budgetsWithSpending.map(b => (
                  <tr key={b.budgetID}>
                    <td className="id-cell">#{b.budgetID}</td>
                    {isAdmin && <td><strong>{getName(b.userID)}</strong></td>}
                    <td><span className="cat-pill">{catMap[b.categoryID] || 'Unknown'}</span></td>
                    <td className="amount-cell">R {parseFloat(b.amount).toFixed(2)}</td>
                    <td className="amount-cell">R {parseFloat(b.spent).toFixed(2)}</td>
                    <td>
                      {b.status === 'overspent' && (
                        <span style={{ color: '#dc3545', fontWeight: 600 }}>
                          Overspent by R {b.overspent.toFixed(2)}
                        </span>
                      )}
                      {b.status === 'exhausted' && (
                        <span style={{ color: '#ffc107', fontWeight: 600 }}>
                          Fully Used
                        </span>
                      )}
                      {b.status === 'active' && (
                        <span style={{ color: '#28a745', fontWeight: 600 }}>
                          {b.percentage.toFixed(0)}% Used
                        </span>
                      )}
                    </td>
                    <td>{MONTHS[b.month-1]} {b.year}</td>
                    <td style={{ display:'flex', gap:6 }}>
                      {!isAdmin && (
                        <>
                          <button className="edit-btn" onClick={() => { setEditBudget({...b}); setEditOpen(true); }}>Edit</button>
                          <button className="del-btn"  onClick={() => { setDelID(b.budgetID); setDelOpen(true); }}>Delete</button>
                        </>
                      )}
                      {isAdmin && <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>View only</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editOpen && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2>Update Budget</h2>
            <div className="field"><label>Student</label>
              <select value={editBudget.userID}
                onChange={e => setEditBudget({...editBudget, userID:parseInt(e.target.value)})}>
                {users.map(u => <option key={u.userID} value={u.userID}>{u.username}</option>)}
              </select></div>
            <div className="field"><label>Category</label>
              <select value={editBudget.categoryID}
                onChange={e => setEditBudget({...editBudget, categoryID:parseInt(e.target.value)})}>
                {categories.map(cat => <option key={cat.categoryID} value={cat.categoryID}>{cat.categoryName}</option>)}
              </select></div>
            <div className="field"><label>Amount (R)</label>
              <input type="number" min="0" step="0.01" value={editBudget.amount}
                onChange={e => setEditBudget({...editBudget, amount:parseFloat(e.target.value)})} /></div>
            <div className="row2">
              <div className="field"><label>Month</label>
                <select value={editBudget.month}
                  onChange={e => setEditBudget({...editBudget, month:parseInt(e.target.value)})}>
                  {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select></div>
              <div className="field"><label>Year</label>
                <select value={editBudget.year}
                  onChange={e => setEditBudget({...editBudget, year:parseInt(e.target.value)})}>
                  {[2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select></div>
            </div>
            <div className="modal-btns">
              <button className="btn-cancel" onClick={() => setEditOpen(false)}>Cancel</button>
              <button className="btn-save"   onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {delOpen && (
        <div className="confirm-overlay open">
          <div className="confirm-box">
            <h2>Delete Budget?</h2>
            <p>This budget record will be permanently removed.</p>
            <div className="confirm-btns">
              <button className="btn-cancel"  onClick={() => setDelOpen(false)}>Cancel</button>
              <button className="btn-confirm" onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {duplicateWarning && (
        <div className="confirm-overlay open">
          <div className="confirm-box">
            <h2>⚠️ Duplicate Budget Detected</h2>
            <p>{duplicateWarning.message}</p>
            <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.9rem' }}>
              <strong>Existing:</strong> R {duplicateWarning.existing.amount.toFixed(2)} for {duplicateWarning.existing.month}/{duplicateWarning.existing.year}<br/>
              <strong>New:</strong> R {duplicateWarning.new.amount.toFixed(2)} for {duplicateWarning.new.month}/{duplicateWarning.new.year}
            </div>
            <div className="confirm-btns">
              <button className="btn-cancel" onClick={() => { setDuplicateWarning(null); setPendingBudget(null); }}>Cancel</button>
              <button className="btn-confirm" onClick={() => handleDuplicateDecision(false)}>Add Both</button>
              <button className="btn-confirm" onClick={() => handleDuplicateDecision(true)} style={{ background: '#dc3545' }}>Replace Existing</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Budgets;
