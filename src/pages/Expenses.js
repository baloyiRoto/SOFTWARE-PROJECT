import React, { useState, useEffect } from 'react';
import '../App.css';

const CATS = { 1:'Food', 2:'Transport', 3:'Rent', 4:'Stationery', 5:'Entertainment', 6:'Data' };

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

// users prop comes LIVE from App.js — always up to date
function Expenses({ users = [] }) {

  const [expenses, setExpenses] = useState(() => {
    try { const s = localStorage.getItem('ss_expenses'); return s ? JSON.parse(s) : INITIAL_EXPENSES; }
    catch { return INITIAL_EXPENSES; }
  });
  const [nextID, setNextID] = useState(() => {
    try { const s = localStorage.getItem('ss_expenses_nid'); return s ? parseInt(s) : 11; }
    catch { return 11; }
  });

  useEffect(() => { localStorage.setItem('ss_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('ss_expenses_nid', String(nextID)); }, [nextID]);

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

  // When users list updates (new user added), set default selection
  useEffect(() => {
    if (users.length > 0 && !userID) setUserID(String(users[0].userID));
  }, [users]);

  const showAlert = (msg, type='alert-success') => {
    setAlert({ show:true, msg, type });
    setTimeout(() => setAlert({ show:false, msg:'', type:'' }), 4000);
  };

  const getName = (id) => {
    const found = users.find(u => u.userID === id);
    return found ? found.username : `User #${id}`;
  };

  const addExpense = () => {
    if (!amount || !date || !description.trim()) { showAlert('All fields are required.','alert-error'); return; }
    if (parseFloat(amount) <= 0) { showAlert('Amount must be greater than zero.','alert-error'); return; }
    if (!userID) { showAlert('Please select a student.','alert-error'); return; }
    const newExp = { expenseID:nextID, userID:parseInt(userID), categoryID:parseInt(categoryID),
                     amount:parseFloat(amount), description:description.trim(), expenseDate:date };
    setExpenses(prev => [newExp, ...prev]);
    setNextID(prev => prev + 1);
    setAmount(''); setDescription('');
    showAlert(`Expense saved for ${getName(parseInt(userID))}!`);
  };

  const saveEdit = () => {
    if (!editExp.description.trim() || !editExp.amount || !editExp.expenseDate) {
      showAlert('All fields required.','alert-error'); return;
    }
    setExpenses(expenses.map(e => e.expenseID === editExp.expenseID ? editExp : e));
    setEditOpen(false);
    showAlert('Expense updated!');
  };

  const confirmDelete = () => {
    setExpenses(expenses.filter(e => e.expenseID !== delID));
    setDelOpen(false);
    showAlert('Expense deleted.');
  };

  return (
    <main>
      <div className="page-hero">
        <h1>Track <em>Expenses</em></h1>
        <p>Log, update and remove student expense records</p>
      </div>
      {alert.show && <div className={`alert show ${alert.type}`}>{alert.msg}</div>}

      <div className="layout">
        {/* ── ADD FORM ── */}
        <div className="card">
          <div className="card-title">Add New Expense</div>

          <div className="field"><label>Student</label>
            {users.length === 0
              ? <p style={{color:'#e11d48',fontSize:'13px'}}>⚠ No users found. Add a user first on the Users page.</p>
              : <select value={userID} onChange={e => setUserID(e.target.value)}>
                  {users.map(u => (
                    <option key={u.userID} value={u.userID}>{u.username}</option>
                  ))}
                </select>
            }</div>

          <div className="field"><label>Category</label>
            <select value={categoryID} onChange={e => setCategoryID(e.target.value)}>
              {Object.entries(CATS).map(([id,name]) => <option key={id} value={id}>{name}</option>)}
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

        {/* ── TABLE ── */}
        <div className="card">
          <div className="card-title">All Expenses</div>
          <div className="table-top"><span className="badge-count">{expenses.length} records</span></div>
          <table>
            <thead><tr><th>ID</th><th>Student</th><th>Category</th><th>Amount</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.expenseID}>
                  <td className="id-cell">#{e.expenseID}</td>
                  <td><strong>{getName(e.userID)}</strong></td>
                  <td><span className="cat-pill">{CATS[e.categoryID]}</span></td>
                  <td className="amount-cell">R {parseFloat(e.amount).toFixed(2)}</td>
                  <td>{e.expenseDate}</td>
                  <td style={{ display:'flex', gap:6 }}>
                    <button className="edit-btn" onClick={() => { setEditExp({...e}); setEditOpen(true); }}>Edit</button>
                    <button className="del-btn"  onClick={() => { setDelID(e.expenseID); setDelOpen(true); }}>Delete</button>
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
                {Object.entries(CATS).map(([id,name]) => <option key={id} value={id}>{name}</option>)}
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
    </main>
  );
}

export default Expenses;
