import React, { useState, useEffect } from 'react';
import '../App.css';

const CATS   = { 1:'Food', 2:'Transport', 3:'Rent', 4:'Stationery', 5:'Entertainment', 6:'Data' };
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
  const [nextID, setNextID] = useState(() => {
    try { const s = localStorage.getItem('ss_budgets_nid'); return s ? parseInt(s) : 9; }
    catch { return 9; }
  });

  useEffect(() => { localStorage.setItem('ss_budgets', JSON.stringify(budgets)); }, [budgets]);
  useEffect(() => { localStorage.setItem('ss_budgets_nid', String(nextID)); }, [nextID]);

  // Form state — default to first user in live list
  const [userID,     setUserID]     = useState('');
  const [categoryID, setCategoryID] = useState('1');
  const [amount,     setAmount]     = useState('');
  const [month,      setMonth]      = useState('4');
  const [year,       setYear]       = useState('2026');
  const [editOpen,   setEditOpen]   = useState(false);
  const [editBudget, setEditBudget] = useState(null);
  const [delOpen,    setDelOpen]    = useState(false);
  const [delID,      setDelID]      = useState(null);
  const [alert,      setAlert]      = useState({ show:false, msg:'', type:'' });

  const isAdmin = currentUser.role === 'admin';
  const visibleBudgets = isAdmin
    ? budgets
    : budgets.filter(budget => budget.userID === currentUser.userID);
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
    if (!amount || parseFloat(amount) <= 0) { showAlert('Enter a valid amount.','alert-error'); return; }
    if (!userID) { showAlert('Please select a student.','alert-error'); return; }
    const newB = { budgetID:nextID, userID:parseInt(userID), categoryID:parseInt(categoryID),
                   amount:parseFloat(amount), month:parseInt(month), year:parseInt(year) };
    setBudgets(prev => [newB, ...prev]);
    setNextID(prev => prev + 1);
    setAmount('');
    showAlert(`Budget saved for ${getName(parseInt(userID))}!`);
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
  };

  return (
    <main>
      <div className="page-hero">
        <h1>Monthly <em>Budgets</em></h1>
        <p>Set, update and remove student budget allocations</p>
      </div>
      {alert.show && <div className={`alert show ${alert.type}`}>{alert.msg}</div>}

      <div className="stats" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:28 }}>
        <div className="stat"><div className="stat-label">Total Budgeted</div>
          <div className="stat-value"><span>R</span>{total.toLocaleString()}</div></div>
        <div className="stat"><div className="stat-label">Budget Records</div>
          <div className="stat-value">{visibleBudgets.length}</div></div>
        <div className="stat"><div className="stat-label">Students in System</div>
          <div className="stat-value">{studentCount}</div></div>
      </div>

      <div className="layout">
        {/* ── ADD FORM ── */}
        {!isAdmin && (
        <div className="card">
          <div className="card-title">Add Budget</div>

          <div className="field"><label>Student</label>
            <input type="text" value={currentUser.username} disabled /></div>

          <div className="field"><label>Category</label>
            <select value={categoryID} onChange={e => setCategoryID(e.target.value)}>
              {Object.entries(CATS).map(([id,name]) => <option key={id} value={id}>{name}</option>)}
            </select></div>

          <div className="field"><label>Amount (R) *</label>
            <input type="number" placeholder="e.g. 1500" min="0" step="0.01"
              value={amount} onChange={e => setAmount(e.target.value)} /></div>

          <div className="row2">
            <div className="field"><label>Month</label>
              <select value={month} onChange={e => setMonth(e.target.value)}>
                {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select></div>
            <div className="field"><label>Year</label>
              <select value={year} onChange={e => setYear(e.target.value)}>
                {[2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select></div>
          </div>

          <button className="btn" onClick={addBudget} disabled={users.length === 0}>Add Budget</button>
        </div>
        )}

        {/* ── TABLE ── */}
        <div className={`card ${isAdmin ? 'admin-only-full' : ''}`}>
          <div className="card-title">All Budgets</div>
          <div className="table-top"><span className="badge-count">{visibleBudgets.length} records</span></div>
          <table>
            <thead><tr><th>ID</th><th>Student</th><th>Category</th><th>Amount</th><th>Month/Year</th><th>Actions</th></tr></thead>
            <tbody>
              {visibleBudgets.map(b => (
                <tr key={b.budgetID}>
                  <td className="id-cell">#{b.budgetID}</td>
                  <td><strong>{getName(b.userID)}</strong></td>
                  <td><span className="cat-pill">{CATS[b.categoryID]}</span></td>
                  <td className="amount-cell">R {parseFloat(b.amount).toFixed(2)}</td>
                  <td>{MONTHS[b.month-1]} {b.year}</td>
                  <td style={{ display:'flex', gap:6 }}>
                    <button className="edit-btn" onClick={() => { setEditBudget({...b}); setEditOpen(true); }}>Edit</button>
                    <button className="del-btn"  onClick={() => { setDelID(b.budgetID); setDelOpen(true); }}>Delete</button>
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
            <h2>Update Budget</h2>
            <div className="field"><label>Student</label>
              <select value={editBudget.userID}
                onChange={e => setEditBudget({...editBudget, userID:parseInt(e.target.value)})}>
                {users.map(u => <option key={u.userID} value={u.userID}>{u.username}</option>)}
              </select></div>
            <div className="field"><label>Category</label>
              <select value={editBudget.categoryID}
                onChange={e => setEditBudget({...editBudget, categoryID:parseInt(e.target.value)})}>
                {Object.entries(CATS).map(([id,name]) => <option key={id} value={id}>{name}</option>)}
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
    </main>
  );
}

export default Budgets;
