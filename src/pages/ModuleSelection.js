import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function ModuleSelection({ currentUser }) {
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === 'admin';
  const [trends, setTrends] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      try {
        const expenses = JSON.parse(localStorage.getItem('ss_expenses') || '[]');
        const budgets = JSON.parse(localStorage.getItem('ss_budgets') || '[]');
        const categories = JSON.parse(localStorage.getItem('ss_categories') || '[]');
        
        const userExpenses = expenses.filter(e => e.userID === currentUser.userID);
        const userBudgets = budgets.filter(b => b.userID === currentUser.userID);
        
        const totalSpent = userExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalBudgeted = userBudgets.reduce((sum, b) => sum + b.amount, 0);
        
        // Calculate spending by category
        const categorySpending = {};
        userExpenses.forEach(e => {
          const cat = categories.find(c => c.categoryID === e.categoryID);
          const catName = cat ? cat.categoryName : 'Unknown';
          categorySpending[catName] = (categorySpending[catName] || 0) + e.amount;
        });
        
        // Find top spending category
        const topCategory = Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0];
        
        setTrends({
          totalSpent,
          totalBudgeted,
          remaining: totalBudgeted - totalSpent,
          topCategory: topCategory ? topCategory[0] : 'N/A',
          topCategoryAmount: topCategory ? topCategory[1] : 0,
          expenseCount: userExpenses.length
        });
      } catch {
        setTrends(null);
      }
    }
  }, [currentUser.userID, isAdmin]);

  return (
    <main className="module-selection-shell">
      <div className="module-selection-hero">
        <h1>Welcome to <em>StudentHub</em></h1>
        <p>Choose a module to get started</p>
      </div>

      {!isAdmin && trends && (
        <div style={{ maxWidth: '800px', margin: '0 auto 32px auto', padding: '0 20px' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <div className="card-title" style={{ color: 'white', borderBottom: 'none' }}>📊 Your Spending Overview</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Total Spent</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>R {trends.totalSpent.toFixed(2)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Budgeted</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>R {trends.totalBudgeted.toFixed(2)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Remaining</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: trends.remaining >= 0 ? '#4ade80' : '#f87171' }}>
                  R {trends.remaining.toFixed(2)}
                </div>
              </div>
            </div>
            {trends.topCategory && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.9rem' }}>
                <strong>Top spending category:</strong> {trends.topCategory} (R {trends.topCategoryAmount.toFixed(2)})
              </div>
            )}
          </div>
        </div>
      )}

      <div className="module-cards">
        <div className="module-card" onClick={() => navigate('/spendsmart')}>
          <div className="module-icon">💰</div>
          <h2>SpendSmart</h2>
          <p>Track your expenses, manage budgets, and analyze your spending patterns</p>
          <div className="module-features">
            <span>📊 Expense Tracking</span>
            <span>🎯 Budget Management</span>
            <span>📈 Reports & Analytics</span>
          </div>
          <button className="module-btn">Open SpendSmart</button>
        </div>

        {!isAdmin && (
          <div className="module-card" onClick={() => navigate('/mealmate')}>
            <div className="module-icon">🍳</div>
            <h2>MealMate</h2>
            <p>Manage your kitchen inventory, generate AI recipes, and get smart shopping suggestions</p>
            <div className="module-features">
              <span>🧊 Inventory Management</span>
              <span>🤖 AI Recipe Generator</span>
              <span>🛒 Smart Shopping</span>
            </div>
            <button className="module-btn">Open MealMate</button>
          </div>
        )}
      </div>
    </main>
  );
}

export default ModuleSelection;
