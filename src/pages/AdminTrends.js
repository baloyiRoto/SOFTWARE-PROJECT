import React, { useState, useEffect } from 'react';
import '../App.css';

function AdminTrends({ users, currentUser }) {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [recipes, setRecipes] = useState([]);

  // Load data from localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        const e = localStorage.getItem('ss_expenses');
        if (e) setExpenses(JSON.parse(e));
      } catch {}
      try {
        const c = localStorage.getItem('ss_categories');
        if (c) setCategories(JSON.parse(c));
      } catch {}
      try {
        const i = localStorage.getItem('mm_inventory');
        if (i) setInventory(JSON.parse(i));
      } catch {}
      try {
        const r = localStorage.getItem('mm_recipes');
        if (r) setRecipes(JSON.parse(r));
      } catch {}
    };

    loadData();

    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('expenseChange', handleStorageChange);
    window.addEventListener('budgetChange', handleStorageChange);
    window.addEventListener('categoryChange', handleStorageChange);
    window.addEventListener('inventoryChange', handleStorageChange);
    window.addEventListener('recipeChange', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('expenseChange', handleStorageChange);
      window.removeEventListener('budgetChange', handleStorageChange);
      window.removeEventListener('categoryChange', handleStorageChange);
      window.removeEventListener('inventoryChange', handleStorageChange);
      window.removeEventListener('recipeChange', handleStorageChange);
    };
  }, [users]);

  // Calculate expense trends
  const expenseByCategory = categories.map(cat => {
    const catExpenses = expenses.filter(e => e.categoryID === cat.categoryID);
    const total = catExpenses.reduce((sum, e) => sum + e.amount, 0);
    const count = catExpenses.length;
    const avg = count > 0 ? total / count : 0;
    const max = count > 0 ? Math.max(...catExpenses.map(e => e.amount)) : 0;
    const min = count > 0 ? Math.min(...catExpenses.map(e => e.amount)) : 0;
    return {
      category: cat.categoryName,
      total,
      count,
      avg,
      max,
      min
    };
  }).filter(c => c.count > 0).sort((a, b) => b.total - a.total);

  const expenseByStudent = users.map(user => {
    const userExpenses = expenses.filter(e => e.userID === user.userID);
    const total = userExpenses.reduce((sum, e) => sum + e.amount, 0);
    const count = userExpenses.length;
    const avg = count > 0 ? total / count : 0;
    return {
      student: user.username,
      total,
      count,
      avg
    };
  }).filter(s => s.count > 0).sort((a, b) => b.total - a.total);

  // Calculate inventory trends (food items)
  const inventoryByCategory = categories.map(cat => {
    const catItems = inventory.filter(i => i.categoryID === cat.categoryID);
    const count = catItems.length;
    const totalQty = catItems.reduce((sum, i) => sum + i.quantity, 0);
    return {
      category: cat.categoryName,
      count,
      totalQty
    };
  }).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

  // Most bought items (from inventory - items that appear most frequently)
  const mostBoughtItems = inventory.reduce((acc, item) => {
    const existing = acc.find(i => i.name.toLowerCase() === item.name.toLowerCase());
    if (existing) {
      existing.count++;
      existing.totalQty += item.quantity;
    } else {
      acc.push({ name: item.name, count: 1, totalQty: item.quantity });
    }
    return acc;
  }, []).sort((a, b) => b.count - a.count).slice(0, 5);

  const maxExpense = expenseByCategory.length > 0 ? Math.max(...expenseByCategory.map(c => c.total)) : 1;
  const maxInventory = inventoryByCategory.length > 0 ? Math.max(...inventoryByCategory.map(c => c.count)) : 1;

  return (
    <main>
      <div className="page-hero">
        <h1>Admin <em>Trends Dashboard</em></h1>
        <p>Overview of student spending and food inventory patterns</p>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
        {/* SpendSmart Trends */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ marginBottom: 20, color: 'var(--purple-dark)', borderBottom: '2px solid var(--purple-light)', paddingBottom: 10 }}>
            💰 SpendSmart Trends
          </h2>

          {/* Expense by Category */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">Expenses by Category</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {expenseByCategory.map(cat => (
                <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 150, fontWeight: 600 }}>{cat.category}</div>
                  <div style={{ flex: 1, background: '#e5e7eb', borderRadius: 8, height: 24, overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${(cat.total / maxExpense) * 100}%`, 
                        background: 'linear-gradient(90deg, #667eea, #764ba2)', 
                        height: '100%',
                        borderRadius: 8
                      }} 
                    />
                  </div>
                  <div style={{ width: 120, textAlign: 'right', fontWeight: 600 }}>R {cat.total.toFixed(2)}</div>
                  <div style={{ width: 80, fontSize: '0.85rem', color: '#6b7280' }}>{cat.count} items</div>
                </div>
              ))}
            </div>
            {expenseByCategory.length === 0 && (
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', padding: 16 }}>No expense data available.</p>
            )}
          </div>

          {/* Expense by Student */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">Top Spending Students</div>
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Total Spent</th>
                  <th>Transactions</th>
                  <th>Average</th>
                </tr>
              </thead>
              <tbody>
                {expenseByStudent.map(s => (
                  <tr key={s.student}>
                    <td><strong>{s.student}</strong></td>
                    <td className="amount-cell">R {s.total.toFixed(2)}</td>
                    <td>{s.count}</td>
                    <td className="amount-cell">R {s.avg.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expenseByStudent.length === 0 && (
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', padding: 16 }}>No student expense data available.</p>
            )}
          </div>

          {/* Category Statistics */}
          <div className="card">
            <div className="card-title">Category Statistics</div>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Total</th>
                  <th>Average</th>
                  <th>Max</th>
                  <th>Min</th>
                </tr>
              </thead>
              <tbody>
                {expenseByCategory.map(c => (
                  <tr key={c.category}>
                    <td><strong>{c.category}</strong></td>
                    <td className="amount-cell">R {c.total.toFixed(2)}</td>
                    <td className="amount-cell">R {c.avg.toFixed(2)}</td>
                    <td className="amount-cell">R {c.max.toFixed(2)}</td>
                    <td className="amount-cell">R {c.min.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MealMate Trends */}
        <div>
          <h2 style={{ marginBottom: 20, color: 'var(--purple-dark)', borderBottom: '2px solid var(--purple-light)', paddingBottom: 10 }}>
            🍳 MealMate Trends
          </h2>

          {/* Most Bought Items */}
          <div className="card">
            <div className="card-title">Most Bought Items</div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Times Added</th>
                  <th>Total Quantity</th>
                </tr>
              </thead>
              <tbody>
                {mostBoughtItems.map(item => (
                  <tr key={item.name}>
                    <td><strong>{item.name}</strong></td>
                    <td>{item.count}</td>
                    <td>{item.totalQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {mostBoughtItems.length === 0 && (
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', padding: 16 }}>No inventory data available.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default AdminTrends;
