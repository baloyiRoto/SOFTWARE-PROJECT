import React, { useState, useEffect } from 'react';
import '../App.css';

const LOCATIONS = { 1: 'Fridge', 2: 'Cupboard', 3: 'Pantry', 4: 'Freezer' };
const CATEGORIES = { 1: 'Vegetables', 2: 'Fruits', 3: 'Dairy', 4: 'Meat', 5: 'Grains', 6: 'Condiments', 7: 'Beverages', 8: 'Other' };
const UNITS = ['kg', 'g', 'liters', 'ml', 'pieces', 'cups', 'tablespoons', 'teaspoons', 'loaves', 'packs', 'cans', 'bottles', 'boxes'];
const QUANTITY_OPTIONS = {
  'kg': [0.1, 0.5, 1, 2, 5, 10],
  'g': [10, 50, 100, 250, 500, 1000],
  'liters': [0.1, 0.5, 1, 2, 5],
  'ml': [10, 50, 100, 250, 500, 1000],
  'pieces': [1, 2, 3, 4, 5, 6, 12, 24],
  'cups': [0.25, 0.5, 1, 2, 4],
  'tablespoons': [0.5, 1, 2, 4, 8],
  'teaspoons': [0.5, 1, 2, 4, 8],
  'loaves': [1, 2],
  'packs': [1, 2, 3, 5, 10],
  'cans': [1, 2, 3, 6],
  'bottles': [1, 2, 6, 12],
  'boxes': [1, 2, 5, 10]
};

const INITIAL_INVENTORY = [
  { itemID: 1, userID: 1, name: 'Milk', locationID: 1, categoryID: 3, quantity: 2, unit: 'liters', expiryDate: '2026-05-20' },
  { itemID: 2, userID: 1, name: 'Eggs', locationID: 1, categoryID: 3, quantity: 12, unit: 'pieces', expiryDate: '2026-05-25' },
  { itemID: 3, userID: 1, name: 'Bread', locationID: 2, categoryID: 5, quantity: 1, unit: 'loaf', expiryDate: '2026-05-18' },
  { itemID: 4, userID: 2, name: 'Chicken', locationID: 4, categoryID: 4, quantity: 500, unit: 'grams', expiryDate: '2026-05-30' },
  { itemID: 5, userID: 2, name: 'Rice', locationID: 3, categoryID: 5, quantity: 2, unit: 'kg', expiryDate: '2026-12-01' },
];

function Inventory({ users = [], currentUser = {} }) {
  const [inventory, setInventory] = useState(() => {
    try { const s = localStorage.getItem('mm_inventory'); return s ? JSON.parse(s) : INITIAL_INVENTORY; }
    catch { return INITIAL_INVENTORY; }
  });
  const [nextID, setNextID] = useState(() => {
    try { const s = localStorage.getItem('mm_inventory_nid'); return s ? parseInt(s) : 6; }
    catch { return 6; }
  });

  useEffect(() => { localStorage.setItem('mm_inventory', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('mm_inventory_nid', String(nextID)); }, [nextID]);

  const [name, setName] = useState('');
  const [locationID, setLocationID] = useState('1');
  const [categoryID, setCategoryID] = useState('1');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pieces');
  const [expiryDate, setExpiryDate] = useState('');

  const getQuantityOptions = (selectedUnit) => QUANTITY_OPTIONS[selectedUnit] || [1, 2, 3, 4, 5];
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [delOpen, setDelOpen] = useState(false);
  const [delID, setDelID] = useState(null);
  const [alert, setAlert] = useState({ show: false, msg: '', type: '' });

  const isAdmin = currentUser.role === 'admin';
  const visibleInventory = isAdmin
    ? inventory
    : inventory.filter(item => item.userID === currentUser.userID);

  const showAlert = (msg, type = 'alert-success') => {
    setAlert({ show: true, msg, type });
    setTimeout(() => setAlert({ show: false, msg: '', type: '' }), 4000);
  };

  const addItem = () => {
    if (!name.trim() || !quantity || !unit) {
      showAlert('Name, quantity, and unit are required.', 'alert-error');
      return;
    }
    if (parseFloat(quantity) <= 0) {
      showAlert('Quantity must be greater than zero.', 'alert-error');
      return;
    }
    const newItem = {
      itemID: nextID,
      userID: currentUser.userID,
      name: name.trim(),
      locationID: parseInt(locationID),
      categoryID: parseInt(categoryID),
      quantity: parseFloat(quantity),
      unit: unit,
      expiryDate: expiryDate || null
    };
    setInventory(prev => [newItem, ...prev]);
    setNextID(prev => prev + 1);
    setName(''); setQuantity('1'); setUnit('pieces'); setExpiryDate('');
    showAlert('Item added to inventory!');
  };

  const saveEdit = () => {
    if (!editItem.name.trim() || !editItem.quantity || !editItem.unit.trim()) {
      showAlert('Name, quantity, and unit are required.', 'alert-error');
      return;
    }
    setInventory(inventory.map(item => item.itemID === editItem.itemID ? editItem : item));
    setEditOpen(false);
    showAlert('Item updated!');
  };

  const confirmDelete = () => {
    setInventory(inventory.filter(item => item.itemID !== delID));
    setDelOpen(false);
    showAlert('Item deleted.');
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  return (
    <main>
      <div className="page-hero">
        <h1>MealMate <em>Inventory</em></h1>
        <p>Track what's in your fridge, cupboard, and pantry</p>
      </div>
      {alert.show && <div className={`alert show ${alert.type}`}>{alert.msg}</div>}

      <div className="layout">
        {/* ── ADD FORM ── */}
        <div className="card">
          <div className="card-title">Add Item</div>

          <div className="field"><label>Item Name</label>
            <input type="text" placeholder="e.g. Milk, Eggs, Rice"
              value={name} onChange={e => setName(e.target.value)} /></div>

          <div className="row2">
            <div className="field"><label>Location</label>
              <select value={locationID} onChange={e => setLocationID(e.target.value)}>
                {Object.entries(LOCATIONS).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select></div>
            <div className="field"><label>Category</label>
              <select value={categoryID} onChange={e => setCategoryID(e.target.value)}>
                {Object.entries(CATEGORIES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select></div>
          </div>

          <div className="row2">
            <div className="field"><label>Quantity</label>
              <select value={quantity} onChange={e => setQuantity(e.target.value)}>
                {getQuantityOptions(unit).map(q => <option key={q} value={q}>{q}</option>)}
              </select></div>
            <div className="field"><label>Unit</label>
              <select value={unit} onChange={e => setUnit(e.target.value)}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select></div>
          </div>

          <div className="field"><label>Expiry Date (optional)</label>
            <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} /></div>

          <button className="btn" onClick={addItem}>Add to Inventory</button>
        </div>

        {/* ── TABLE ── */}
        <div className="card">
          <div className="card-title">Your Inventory</div>
          <div className="table-top"><span className="badge-count">{visibleInventory.length} items</span></div>
          <table>
            <thead><tr><th>ID</th><th>Item</th><th>Location</th><th>Category</th><th>Quantity</th><th>Expiry</th><th>Actions</th></tr></thead>
            <tbody>
              {visibleInventory.map(item => (
                <tr key={item.itemID} className={isExpired(item.expiryDate) ? 'expired-row' : isExpiringSoon(item.expiryDate) ? 'expiring-row' : ''}>
                  <td className="id-cell">#{item.itemID}</td>
                  <td><strong>{item.name}</strong></td>
                  <td><span className="cat-pill">{LOCATIONS[item.locationID]}</span></td>
                  <td><span className="cat-pill">{CATEGORIES[item.categoryID]}</span></td>
                  <td>{item.quantity} {item.unit}</td>
                  <td>{item.expiryDate ? (isExpired(item.expiryDate) ? <span className="expired-badge">Expired</span> : isExpiringSoon(item.expiryDate) ? <span className="expiring-badge">Expiring Soon</span> : item.expiryDate) : '-'}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="edit-btn" onClick={() => { setEditItem({ ...item }); setEditOpen(true); }}>Edit</button>
                    <button className="del-btn" onClick={() => { setDelID(item.itemID); setDelOpen(true); }}>Delete</button>
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
            <h2>Update Item</h2>
            <div className="field"><label>Item Name</label>
              <input type="text" value={editItem.name}
                onChange={e => setEditItem({ ...editItem, name: e.target.value })} /></div>
            <div className="row2">
              <div className="field"><label>Location</label>
                <select value={editItem.locationID}
                  onChange={e => setEditItem({ ...editItem, locationID: parseInt(e.target.value) })}>
                  {Object.entries(LOCATIONS).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select></div>
              <div className="field"><label>Category</label>
                <select value={editItem.categoryID}
                  onChange={e => setEditItem({ ...editItem, categoryID: parseInt(e.target.value) })}>
                  {Object.entries(CATEGORIES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select></div>
            </div>
            <div className="row2">
              <div className="field"><label>Quantity</label>
                <select value={editItem.quantity}
                  onChange={e => setEditItem({ ...editItem, quantity: parseFloat(e.target.value) })}>
                  {getQuantityOptions(editItem.unit).map(q => <option key={q} value={q}>{q}</option>)}
                </select></div>
              <div className="field"><label>Unit</label>
                <select value={editItem.unit}
                  onChange={e => setEditItem({ ...editItem, unit: e.target.value })}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select></div>
            </div>
            <div className="field"><label>Expiry Date</label>
              <input type="date" value={editItem.expiryDate || ''}
                onChange={e => setEditItem({ ...editItem, expiryDate: e.target.value })} /></div>
            <div className="modal-btns">
              <button className="btn-cancel" onClick={() => setEditOpen(false)}>Cancel</button>
              <button className="btn-save" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {delOpen && (
        <div className="confirm-overlay open">
          <div className="confirm-box">
            <h2>Delete Item?</h2>
            <p>This item will be permanently removed from your inventory.</p>
            <div className="confirm-btns">
              <button className="btn-cancel" onClick={() => setDelOpen(false)}>Cancel</button>
              <button className="btn-confirm" onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Inventory;
