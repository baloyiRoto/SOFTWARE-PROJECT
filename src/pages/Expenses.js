import React, { useState, useEffect, useCallback } from 'react';
import '../App.css';

const GROQ_API_KEY = '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';

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
function Expenses({ users = [], currentUser = {} }) {

  const [expenses, setExpenses] = useState(() => {
    try { const s = localStorage.getItem('ss_expenses'); return s ? JSON.parse(s) : INITIAL_EXPENSES; }
    catch { return INITIAL_EXPENSES; }
  });

  const [categories] = useState(() => {
    try { const s = localStorage.getItem('ss_categories'); return s ? JSON.parse(s) : INITIAL_CATS; }
    catch { return INITIAL_CATS; }
  });

  const [budgets, setBudgets] = useState(() => {
    try { const s = localStorage.getItem('ss_budgets'); return s ? JSON.parse(s) : INITIAL_BUDGETS; }
    catch { return INITIAL_BUDGETS; }
  });

  const catMap = categories.reduce((acc, cat) => {
    acc[cat.categoryID] = cat.categoryName;
    return acc;
  }, {});
  const [nextID, setNextID] = useState(() => {
    try { const s = localStorage.getItem('ss_expenses_nid'); return s ? parseInt(s) : 11; }
    catch { return 11; }


  });

  useEffect(() => { localStorage.setItem('ss_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('ss_expenses_nid', String(nextID)); }, [nextID]);

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
  useEffect(() => { localStorage.setItem('ss_budgets', JSON.stringify(budgets)); }, [budgets]);

  const [userID,      setUserID]      = useState('');
  const [categoryID,  setCategoryID]  = useState('1');
  const [amount,      setAmount]      = useState('');
  const [date,        setDate]        = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [editOpen,    setEditOpen]    = useState(false);
  const [editExp,     setEditExp]     = useState(null);
  const [delOpen,     setDelOpen]     = useState(false);
  const [delID,       setDelID]       = useState(null);
  const [alert,       setAlert]       = useState({ show:false, msg:'', type:'' });
  const [budgetAlert, setBudgetAlert] = useState(null);
  const [mlInsights,  setMlInsights]  = useState(null);

  const isAdmin = currentUser.role === 'admin';
  const visibleExpenses = isAdmin
    ? expenses
    : expenses.filter(expense => expense.userID === currentUser.userID);
  const visibleBudgets = isAdmin
    ? budgets
    : budgets.filter(budget => budget.userID === currentUser.userID);

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

  const getName = (id) => {
    const found = users.find(u => u.userID === id);
    return found ? found.username : `User #${id}`;
  };

  // Calculate budget status for selected category
  const getBudgetStatus = (catID, expenseDate) => {
    const expenseMonth = new Date(expenseDate).getMonth() + 1;
    const expenseYear = new Date(expenseDate).getFullYear();
    
    const budget = visibleBudgets.find(b => 
      b.categoryID === parseInt(catID) && 
      b.month === expenseMonth && 
      b.year === expenseYear
    );
    
    if (!budget) return null;
    
    const categoryExpenses = visibleExpenses.filter(e => 
      e.categoryID === parseInt(catID) &&
      new Date(e.expenseDate).getMonth() + 1 === expenseMonth &&
      new Date(e.expenseDate).getFullYear() === expenseYear
    );
    
    const spent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    
    return {
      budget,
      spent,
      remaining,
      percentage,
      isOverspent: spent > budget.amount,
      overspentAmount: spent > budget.amount ? spent - budget.amount : 0
    };
  };

  // Generate ML-based budget insights
  const generateMLInsights = useCallback(async () => {
    if (visibleExpenses.length === 0) return;
    
    const recentExpenses = visibleExpenses.slice(0, 20);
    const expenseSummary = recentExpenses.map(e => 
      `${catMap[e.categoryID]}: R${e.amount} on ${e.expenseDate} - ${e.description}`
    ).join('\n');
    
    const budgetSummary = visibleBudgets.map(b => 
      `${catMap[b.categoryID]}: R${b.amount} for ${b.month}/${b.year}`
    ).join('\n');

    const prompt = `You are a budget tracking assistant. Analyze this spending data:

Budgets:
${budgetSummary || 'No budgets set'}

Recent Expenses:
${expenseSummary}

Provide insights in JSON format:
{
  "spendingPatterns": ["pattern 1", "pattern 2"],
  "riskCategories": ["category at risk of overspending"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "predictedOverspend": [{"category": "name", "likelihood": "high/medium/low", "reason": "why"}]
}`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a budget tracking assistant that provides insights in JSON format.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMlInsights(JSON.parse(data.choices[0].message.content));
      }
    } catch (error) {
      console.error('Error generating ML insights:', error);
    }
  }, [visibleExpenses, visibleBudgets, catMap]);

  // Load ML insights on component mount only (not on every change)
  useEffect(() => {
    if (!isAdmin && visibleExpenses.length > 0) {
      generateMLInsights();
    }
  }, []); // Empty dependency array - only run on mount

  const addExpense = () => {
    if (!amount || !date || !description.trim()) { showAlert('All fields are required.','alert-error'); return; }
    if (parseFloat(amount) <= 0) { showAlert('Amount must be greater than zero.','alert-error'); return; }
    if (!userID) { showAlert('Please select a student.','alert-error'); return; }
    
    const newExp = { expenseID:nextID, userID:parseInt(userID), categoryID:parseInt(categoryID),
                     amount:parseFloat(amount), description:description.trim(), expenseDate:date };
    
    // Check budget status before adding
    const budgetStatus = getBudgetStatus(categoryID, date);
    
    if (budgetStatus) {
      const projectedSpent = budgetStatus.spent + parseFloat(amount);
      if (projectedSpent > budgetStatus.budget.amount) {
        const overspendAmount = projectedSpent - budgetStatus.budget.amount;
        setBudgetAlert({
          category: catMap[parseInt(categoryID)],
          budgetAmount: budgetStatus.budget.amount,
          currentSpent: budgetStatus.spent,
          newExpense: parseFloat(amount),
          projectedTotal: projectedSpent,
          overspendAmount,
          expense: newExp
        });
        return; // Don't add expense yet, let user decide
      }
    }
    
    setExpenses(prev => [newExp, ...prev]);
    setNextID(prev => prev + 1);
    setAmount(''); setDescription('');
    showAlert(`Expense saved for ${getName(parseInt(userID))}!`);
    
    // Update ML insights after adding expense
    if (!isAdmin) {
      generateMLInsights();
    }
  };

  const confirmBudgetOverspend = () => {
    if (budgetAlert) {
      setExpenses(prev => [budgetAlert.expense, ...prev]);
      setNextID(prev => prev + 1);
      setAmount(''); setDescription('');
      setBudgetAlert(null);
      showAlert(`Expense saved (overspending by R${budgetAlert.overspendAmount.toFixed(2)})`, 'alert-warning');
      
      // Update ML insights after adding expense
      if (!isAdmin) {
        generateMLInsights();
      }
    }
  };

  const saveEdit = () => {
    if (!editExp.description.trim() || !editExp.amount || !editExp.expenseDate) {
      showAlert('All fields required.','alert-error'); return;
    }
    setExpenses(expenses.map(e => e.expenseID === editExp.expenseID ? editExp : e));
    setEditOpen(false);
    showAlert('Expense updated!');
    
    // Update ML insights after editing expense
    if (!isAdmin) {
      generateMLInsights();
    }
  };

  const confirmDelete = () => {
    setExpenses(expenses.filter(e => e.expenseID !== delID));
    setDelOpen(false);
    showAlert('Expense deleted.');
    
    // Update ML insights after deleting expense
    if (!isAdmin) {
      generateMLInsights();
    }
  };

  return (
    <main>
      <div className="page-hero">
        <h1>Track <em>Expenses</em></h1>
        <p>Log, update and remove student expense records</p>
      </div>
      {alert.show && <div className={`alert show ${alert.type}`}>{alert.msg}</div>}

      {/* ── ML INSIGHTS PANEL ── */}
      {!isAdmin && (
        <div style={{ maxWidth: '1200px', margin: '0 auto 24px auto', padding: '0 20px' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <div className="card-title" style={{ color: 'white', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🤖 AI Budget Insights</span>
              <button 
                className="btn" 
                onClick={generateMLInsights}
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.85rem', padding: '6px 12px' }}
              >
                🔄 Refresh
              </button>
            </div>
            {mlInsights ? (
              <div style={{ marginTop: '16px', display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              {mlInsights.spendingPatterns && mlInsights.spendingPatterns.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px' }}>
                  <strong>📊 Spending Patterns:</strong>
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '0.9rem' }}>
                    {mlInsights.spendingPatterns.map((pattern, idx) => <li key={idx}>{pattern}</li>)}
                  </ul>
                </div>
              )}
              {mlInsights.riskCategories && mlInsights.riskCategories.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px' }}>
                  <strong>⚠️ At Risk:</strong>
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '0.9rem' }}>
                    {mlInsights.riskCategories.map((cat, idx) => <li key={idx}>{cat}</li>)}
                  </ul>
                </div>
              )}
              {mlInsights.predictedOverspend && mlInsights.predictedOverspend.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px' }}>
                  <strong>🔮 Predicted Overspend:</strong>
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '0.9rem' }}>
                    {mlInsights.predictedOverspend.map((pred, idx) => (
                      <li key={idx}>{pred.category} ({pred.likelihood}): {pred.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              {mlInsights.recommendations && mlInsights.recommendations.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px' }}>
                  <strong>💡 Recommendations:</strong>
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '0.9rem' }}>
                    {mlInsights.recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)}
                  </ul>
                </div>
              )}
            </div>
            ) : (
              <div style={{ marginTop: '16px', fontSize: '0.9rem' }}>
                <p>Click "Refresh" to generate AI budget insights based on your spending patterns.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="layout">
        {/* ── ADD FORM ── */}
        {!isAdmin && (
        <div className="card">
          <div className="card-title">Add New Expense</div>

          <div className="field"><label>Student</label>
            <input type="text" value={currentUser.username} disabled /></div>

          <div className="field"><label>Category</label>
            <select value={categoryID} onChange={e => setCategoryID(e.target.value)}>
              {categories.map(cat => <option key={cat.categoryID} value={cat.categoryID}>{cat.categoryName}</option>)}
            </select></div>

          <div className="row2">
            <div className="field"><label>Amount (R)</label>
              <input type="number" placeholder="0.00" min="0" step="0.01"
                value={amount} onChange={e => setAmount(e.target.value)} /></div>
            <div className="field"><label>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
          </div>

          <div className="field"><label>Description</label>
            <input type="text" placeholder="e.g. Groceries at Pick n Pay"
              value={description} onChange={e => setDescription(e.target.value)} /></div>

          <button className="btn" onClick={addExpense} disabled={users.length === 0}>Add Expense</button>
        </div>
        )}

        {/* ── TABLE ── */}
        <div className={`card ${isAdmin ? 'admin-only-full' : ''}`}>
          <div className="card-title">All Expenses</div>
          <div className="table-top"><span className="badge-count">{visibleExpenses.length} records</span></div>
          <table>
            <thead><tr><th>ID</th>{isAdmin && <th>Student</th>}<th>Category</th><th>Amount</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {visibleExpenses.map(e => (
                <tr key={e.expenseID}>
                  <td className="id-cell">#{e.expenseID}</td>
                  {isAdmin && <td><strong>{getName(e.userID)}</strong></td>}
                  <td><span className="cat-pill">{catMap[e.categoryID] || 'Unknown'}</span></td>
                  <td className="amount-cell">R {parseFloat(e.amount).toFixed(2)}</td>
                  <td>{e.expenseDate}</td>
                  <td style={{ display:'flex', gap:6 }}>
                    {!isAdmin && (
                      <>
                        <button className="edit-btn" onClick={() => { setEditExp({...e}); setEditOpen(true); }}>Edit</button>
                        <button className="del-btn"  onClick={() => { setDelID(e.expenseID); setDelOpen(true); }}>Delete</button>
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

      {editOpen && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2>Update Expense</h2>
            <div className="field"><label>Student</label>
              <select value={editExp.userID}
                onChange={e => setEditExp({...editExp, userID:parseInt(e.target.value)})}>
                {users.map(u => <option key={u.userID} value={u.userID}>{u.username}</option>)}
              </select></div>
            <div className="field"><label>Category</label>
              <select value={editExp.categoryID}
                onChange={e => setEditExp({...editExp, categoryID:parseInt(e.target.value)})}>
                {categories.map(cat => <option key={cat.categoryID} value={cat.categoryID}>{cat.categoryName}</option>)}
              </select></div>
            <div className="row2">
              <div className="field"><label>Amount (R)</label>
                <input type="number" value={editExp.amount}
                  onChange={e => setEditExp({...editExp, amount:parseFloat(e.target.value)})} /></div>
              <div className="field"><label>Date</label>
                <input type="date" value={editExp.expenseDate}
                  onChange={e => setEditExp({...editExp, expenseDate:e.target.value})} /></div>
            </div>
            <div className="field"><label>Description</label>
              <input type="text" value={editExp.description}
                onChange={e => setEditExp({...editExp, description:e.target.value})} /></div>
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
            <h2>Delete Expense?</h2>
            <p>This expense record will be permanently removed.</p>
            <div className="confirm-btns">
              <button className="btn-cancel"  onClick={() => setDelOpen(false)}>Cancel</button>
              <button className="btn-confirm" onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {budgetAlert && (
        <div className="confirm-overlay open">
          <div className="confirm-box">
            <h2>⚠️ Budget Overspend Warning</h2>
            <p>Adding this expense will cause you to exceed your budget for <strong>{budgetAlert.category}</strong>.</p>
            <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.9rem' }}>
              <div><strong>Budget:</strong> R {budgetAlert.budgetAmount.toFixed(2)}</div>
              <div><strong>Currently Spent:</strong> R {budgetAlert.currentSpent.toFixed(2)}</div>
              <div><strong>New Expense:</strong> R {budgetAlert.newExpense.toFixed(2)}</div>
              <div><strong>Projected Total:</strong> R {budgetAlert.projectedTotal.toFixed(2)}</div>
              <div style={{ color: '#dc3545', fontWeight: 600, marginTop: '8px' }}>
                <strong>Overspending by:</strong> R {budgetAlert.overspendAmount.toFixed(2)}
              </div>
            </div>
            <div className="confirm-btns">
              <button className="btn-cancel" onClick={() => setBudgetAlert(null)}>Cancel</button>
              <button className="btn-confirm" onClick={confirmBudgetOverspend} style={{ background: '#dc3545' }}>Add Anyway</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Expenses;
