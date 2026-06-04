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

function Categories({ currentUser = {} }) {
  const [categories, setCategories] = useState(() => {
    try { const s = localStorage.getItem('ss_categories'); return s ? JSON.parse(s) : INITIAL_CATS; }
    catch { return INITIAL_CATS; }
  });
  const [nextID, setNextID]         = useState(() => {
    try { const s = localStorage.getItem('ss_categories_nid'); return s ? parseInt(s) : 7; }
    catch { return 7; }
  });

  useEffect(() => { localStorage.setItem('ss_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('ss_categories_nid', String(nextID)); }, [nextID]);

  // Insert form
  const [newName, setNewName]       = useState('');
  const [newDesc, setNewDesc]       = useState('');

  // Edit modal
  const [editOpen, setEditOpen]     = useState(false);
  const [editCat, setEditCat]       = useState(null);

  // Delete confirm
  const [delOpen, setDelOpen]       = useState(false);
  const [delID, setDelID]           = useState(null);

  const [alert, setAlert]           = useState({ show: false, msg: '', type: '' });

  const isAdmin = currentUser.role === 'admin';

  const visibleCategories = (() => {
    if (isAdmin) {
      return categories;
    }

    let relatedCategoryIDs = new Set();

    try {
      const expenses = JSON.parse(localStorage.getItem('ss_expenses') || '[]');
      const budgets = JSON.parse(localStorage.getItem('ss_budgets') || '[]');

      expenses
        .filter(expense => expense.userID === currentUser.userID)
        .forEach(expense => relatedCategoryIDs.add(expense.categoryID));

      budgets
        .filter(budget => budget.userID === currentUser.userID)
        .forEach(budget => relatedCategoryIDs.add(budget.categoryID));
    } catch {
      relatedCategoryIDs = new Set();
    }

    return categories.filter(category => relatedCategoryIDs.has(category.categoryID));
  })();

  const showAlert = (msg, type = 'alert-success') => {
    setAlert({ show: true, msg, type });
    setTimeout(() => setAlert({ show: false, msg: '', type: '' }), 4000);
  };

  // INSERT
  const addCategory = () => {
    if (!newName.trim()) {
      showAlert('Category name is required.', 'alert-error'); return;
    }
    if (categories.find(c => c.categoryName.toLowerCase() === newName.trim().toLowerCase())) {
      showAlert('That category already exists.', 'alert-error'); return;
    }
    setCategories([...categories, { categoryID: nextID, categoryName: newName.trim(), description: newDesc.trim() }]);
    setNextID(nextID + 1);
    setNewName(''); setNewDesc('');
    showAlert(`Category "${newName.trim()}" added!`);
    
    // Dispatch custom event to notify other pages of category change
    window.dispatchEvent(new Event('categoryChange'));
  };

  // UPDATE
  const saveEdit = () => {
    if (!editCat.categoryName.trim()) {
      showAlert('Category name is required.', 'alert-error'); return;
    }
    setCategories(categories.map(c => c.categoryID === editCat.categoryID ? editCat : c));
    setEditOpen(false);
    showAlert(`Category "${editCat.categoryName}" updated!`);
    
    // Dispatch custom event to notify other pages of category change
    window.dispatchEvent(new Event('categoryChange'));
  };

  // DELETE
  const confirmDelete = () => {
    const name = categories.find(c => c.categoryID === delID)?.categoryName;
    setCategories(categories.filter(c => c.categoryID !== delID));
    setDelOpen(false);
    showAlert(`Category "${name}" deleted.`);
    
    // Dispatch custom event to notify other pages of category change
    window.dispatchEvent(new Event('categoryChange'));
  };

  return (
    <main>
      <div className="page-hero">
        <h1>Expense <em>Categories</em></h1>
        <p>Add, update and remove expense category types</p>
      </div>

      {alert.show && <div className={`alert show ${alert.type}`}>{alert.msg}</div>}

      <div className="layout">
        {/* INSERT FORM */}
        {!isAdmin && (
        <div className="card">
          <div className="card-title">Add New Category</div>
          <div className="field"><label>Category Name *</label>
            <input type="text" placeholder="e.g. Health & Medical" value={newName} onChange={e => setNewName(e.target.value)} /></div>
          <div className="field"><label>Description</label>
            <input type="text" placeholder="Brief description..." value={newDesc} onChange={e => setNewDesc(e.target.value)} /></div>
          <button className="btn" onClick={addCategory}>Add Category</button>
        </div>
        )}

        {/* LIST TABLE */}
        <div className={`card ${isAdmin ? 'admin-only-full' : ''}`}>
          <div className="card-title">All Categories</div>
          <div className="table-top"><span className="badge-count">{visibleCategories.length} records</span></div>
          <table>
            <thead><tr><th>ID</th><th>Category</th><th>Description</th><th>Actions</th></tr></thead>
            <tbody>
              {visibleCategories.map(c => (
                <tr key={c.categoryID}>
                  <td className="id-cell">#{c.categoryID}</td>
                  <td><strong>{c.categoryName}</strong></td>
                  <td>{c.description}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="edit-btn" onClick={() => { setEditCat({ ...c }); setEditOpen(true); }}>Edit</button>
                    <button className="del-btn"  onClick={() => { setDelID(c.categoryID); setDelOpen(true); }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editOpen && (
        <div className="modal-overlay open">
          <div className="modal">
            <h2>Update Category</h2>
            <div className="field"><label>Category Name</label>
              <input type="text" value={editCat.categoryName} onChange={e => setEditCat({ ...editCat, categoryName: e.target.value })} /></div>
            <div className="field"><label>Description</label>
              <input type="text" value={editCat.description} onChange={e => setEditCat({ ...editCat, description: e.target.value })} /></div>
            <div className="modal-btns">
              <button className="btn-cancel" onClick={() => setEditOpen(false)}>Cancel</button>
              <button className="btn-save"   onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {delOpen && (
        <div className="confirm-overlay open">
          <div className="confirm-box">
            <h2>Delete Category?</h2>
            <p>This will permanently remove the category.</p>
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

export default Categories;
