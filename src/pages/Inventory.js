import React, { useState, useEffect } from 'react';
import '../App.css';

const GROQ_API_KEY = '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';

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
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pieces');
  const [expiryDate, setExpiryDate] = useState('');
  const [isAutoClassifying, setIsAutoClassifying] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState(null);
  const [bulkAddMode, setBulkAddMode] = useState(false);
  const [inventoryEntries, setInventoryEntries] = useState([{ name: '', locationID: '1', quantity: '1', unit: 'pieces', expiryDate: '' }]);

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

  // Auto-classify item using AI
  const autoClassifyItem = async (itemName) => {
    if (!itemName.trim()) {
      setSuggestedCategory(null);
      return;
    }

    setIsAutoClassifying(true);
    
    try {
      const systemPrompt = 'You are a food storage classification assistant. Given a food item, return ONLY a JSON object with two fields: category and location.\n\nIMPORTANT: Meat, poultry, and fish ALWAYS go in Freezer by default. Never put any meat, chicken, beef, pork, fish, lamb, or mince in Pantry.\n\nLocation rules (strictly follow these):\n- Freezer: ALL raw meat, chicken, beef, pork, fish, lamb, mince, seafood\n- Fridge: milk, cheese, yogurt, butter, eggs, cream, fresh vegetables, fresh fruit, deli meat, tofu, opened condiments, cooked leftovers\n- Pantry: rice, pasta, flour, sugar, salt, spices, oats, cereal, bread, crackers, canned goods, oil, vinegar, dried beans, nuts, coffee, tea\n\nMeat NEVER goes in Pantry. This is the highest priority rule.\n\nCategory rules:\n- Grains: rice, pasta, bread, oats, cereal, flour, couscous, quinoa\n- Dairy: milk, cheese, yogurt, butter, cream, eggs\n- Meat: chicken, beef, pork, fish, lamb, mince\n- Vegetables: any vegetable\n- Fruits: any fruit\n- Condiments: sauces, oils, vinegar, spices, salt\n- Other: anything that doesn\'t fit above\n\nReturn ONLY valid JSON, example: {"category": "Grains", "location": "Pantry"}\nNo explanation, no extra text.';
      
      const userPrompt = `Classify this item: ${itemName}`;
      
      console.log('=== AI Classification Debug ===');
      console.log('Item Name:', itemName);
      console.log('System Prompt:', systemPrompt);
      console.log('User Prompt:', userPrompt);
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          max_tokens: 50,
          response_format: { type: 'json_object' }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.choices[0].message.content.trim();
        
        console.log('Raw AI Response:', result);
        
        // Parse the JSON result (format: { "category": "<category>", "location": "<location>" })
        const parsed = JSON.parse(result);
        const category = parsed.category;
        const location = parsed.location;
        
        console.log('Parsed Category:', category);
        console.log('Parsed Location:', location);
        
        // Map category name to ID
        const categoryMap = {
          'Vegetables': 1,
          'Fruits': 2,
          'Dairy': 3,
          'Meat': 4,
          'Grains': 5,
          'Condiments': 6,
          'Beverages': 7,
          'Other': 8
        };
        
        // Map location name to ID
        const locationMap = {
          'Fridge': '1',
          'Cupboard': '2',
          'Pantry': '3',
          'Pantry/Cupboard': '3',
          'Freezer': '4',
          'Fresh Produce': '3'
        };
        
        // Default unit to pieces since AI no longer provides it
        const unit = 'pieces';
        
        const finalCategoryID = categoryMap[category] || 8;
        const finalLocationID = locationMap[location] || '1';
        
        console.log('Final Category ID:', finalCategoryID);
        console.log('Final Location ID:', finalLocationID);
        console.log('Final Unit:', unit);
        console.log('============================');
        
        setSuggestedCategory(finalCategoryID);
        setLocationID(finalLocationID);
        setUnit(unit);
      }
    } catch {
      // If AI fails, default to Other, Pantry, and pieces
      setSuggestedCategory(8);
      setLocationID('1');
      setUnit('pieces');
    } finally {
      setIsAutoClassifying(false);
    }
  };

  // Auto-classify when name changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (name.trim()) {
        autoClassifyItem(name);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [name]);

  const addItem = () => {
    if (!bulkAddMode) {
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
        categoryID: suggestedCategory || 8, // Use AI-suggested category or default to Other
        quantity: parseFloat(quantity),
        unit: unit,
        expiryDate: expiryDate || null
      };
      setInventory(prev => [newItem, ...prev]);
      setNextID(prev => prev + 1);
      setName(''); setQuantity('1'); setUnit('pieces'); setExpiryDate(''); setSuggestedCategory(null);
      showAlert('Item added to inventory!');
    } else {
      const validEntries = inventoryEntries.filter(entry => entry.name.trim() && entry.quantity && entry.unit);
      if (validEntries.length === 0) {
        showAlert('Please enter at least one valid item.', 'alert-error');
        return;
      }
      
      const newItems = validEntries.map(entry => ({
        itemID: nextID + validEntries.indexOf(entry),
        userID: currentUser.userID,
        name: entry.name.trim(),
        locationID: 1, // Default to Pantry for bulk add (ML auto-detection not implemented for bulk)
        categoryID: 8, // Default to Other for bulk add, could be enhanced with AI
        quantity: parseFloat(entry.quantity),
        unit: entry.unit,
        expiryDate: entry.expiryDate || null
      }));
      
      setInventory(prev => [...newItems, ...prev]);
      setNextID(prev => prev + newItems.length);
      setInventoryEntries([{ name: '', quantity: '1', unit: 'pieces', expiryDate: '' }]);
      showAlert(`${newItems.length} items added to inventory!`);
    }
  };

  const addInventoryEntry = () => {
    setInventoryEntries([...inventoryEntries, { name: '', quantity: '1', unit: 'pieces', expiryDate: '' }]);
  };

  const removeInventoryEntry = (index) => {
    if (inventoryEntries.length > 1) {
      setInventoryEntries(inventoryEntries.filter((_, i) => i !== index));
    }
  };

  const updateInventoryEntry = (index, field, value) => {
    const updated = [...inventoryEntries];
    updated[index][field] = value;
    setInventoryEntries(updated);
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
          <div className="card-title">
            Add Item
            <button 
              type="button" 
              className="btn" 
              style={{ float: 'right', fontSize: '0.8rem', padding: '4px 8px', background: bulkAddMode ? '#667eea' : '' }}
              onClick={() => setBulkAddMode(!bulkAddMode)}
            >
              {bulkAddMode ? '📝 Single Add' : '📦 Bulk Add (Multiple Items)'}
            </button>
          </div>

          {!bulkAddMode ? (
            <>
              <div style={{ padding: '8px 12px', background: '#f0f9ff', borderRadius: '6px', marginBottom: '16px', fontSize: '0.85rem', color: '#0369a1' }}>
                💡 <strong>Tip:</strong> Use <strong>Bulk Add</strong> to add multiple items at once for faster inventory management
              </div>

              <div className="field"><label>Item Name</label>
                <input type="text" placeholder="e.g. Milk, Eggs, Rice"
                  value={name} onChange={e => setName(e.target.value)} />
                {isAutoClassifying && <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>🤖 AI classifying...</span>}
              </div>

              {suggestedCategory && (
                <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: '6px', marginBottom: '16px', fontSize: '0.85rem', color: '#166534' }}>
                  🤖 AI classified as: <strong>{CATEGORIES[suggestedCategory]}</strong> in <strong>{LOCATIONS[locationID]}</strong>
                </div>
              )}

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

              <button className="btn" onClick={addItem} disabled={isAutoClassifying}>
                {isAutoClassifying ? 'Classifying...' : 'Add to Inventory'}
              </button>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 16, padding: 12, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 6, fontSize: '0.9rem', color: 'white' }}>
                � <strong>Bulk Add Mode:</strong> Add multiple items at once for faster inventory management
              </div>

              {inventoryEntries.map((entry, index) => (
                <div key={index} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: index < inventoryEntries.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>Item #{index + 1}</strong>
                    <button 
                      type="button" 
                      className="del-btn"
                      onClick={() => removeInventoryEntry(index)}
                      disabled={inventoryEntries.length === 1}
                      style={{ marginTop: 0 }}
                    >
                      ×
                    </button>
                  </div>

                  <div className="field"><label>Item Name *</label>
                    <input type="text" placeholder="e.g. Milk, Eggs, Rice"
                      value={entry.name} onChange={e => updateInventoryEntry(index, 'name', e.target.value)} />
                  </div>

                  <div className="row2">
                    <div className="field"><label>Quantity *</label>
                      <select value={entry.quantity} onChange={e => updateInventoryEntry(index, 'quantity', e.target.value)}>
                        {getQuantityOptions(entry.unit).map(q => <option key={q} value={q}>{q}</option>)}
                      </select></div>
                    <div className="field"><label>Unit *</label>
                      <select value={entry.unit} onChange={e => updateInventoryEntry(index, 'unit', e.target.value)}>
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select></div>
                  </div>

                  <div className="field"><label>Expiry Date (optional)</label>
                    <input type="date" value={entry.expiryDate} onChange={e => updateInventoryEntry(index, 'expiryDate', e.target.value)} /></div>
                </div>
              ))}

              <button 
                type="button" 
                className="btn" 
                onClick={addInventoryEntry}
                style={{ fontSize: '0.8rem', padding: '6px 12px', marginTop: 8 }}
              >
                + Add Another Item
              </button>

              <button className="btn" onClick={addItem} style={{ marginTop: 16 }}>
                Add {inventoryEntries.length} Items to Inventory
              </button>
            </>
          )}
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
            <div className="field"><label>Category</label>
              <select value={editItem.categoryID}
                onChange={e => setEditItem({ ...editItem, categoryID: parseInt(e.target.value) })}>
                {Object.entries(CATEGORIES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select></div>
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
