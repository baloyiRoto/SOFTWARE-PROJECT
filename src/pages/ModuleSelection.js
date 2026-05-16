import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function ModuleSelection() {
  const navigate = useNavigate();

  return (
    <main className="module-selection-shell">
      <div className="module-selection-hero">
        <h1>Welcome to <em>StudentHub</em></h1>
        <p>Choose a module to get started</p>
      </div>

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
      </div>
    </main>
  );
}

export default ModuleSelection;
