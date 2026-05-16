import React, { useState } from 'react';
import '../App.css';

const GROQ_API_KEY = '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';

function ShoppingSuggestions({ users = [], currentUser = {} }) {
  const [inventory] = useState(() => {
    try { const s = localStorage.getItem('mm_inventory'); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });

  const [budget, setBudget] = useState('');
  const [mealPlan, setMealPlan] = useState('week');
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [alert, setAlert] = useState({ show: false, msg: '', type: '' });

  const isAdmin = currentUser.role === 'admin';
  const visibleInventory = isAdmin
    ? inventory
    : inventory.filter(item => item.userID === currentUser.userID);

  const showAlert = (msg, type = 'alert-success') => {
    setAlert({ show: true, msg, type });
    setTimeout(() => setAlert({ show: false, msg: '', type: '' }), 4000);
  };

  const generateSuggestions = async () => {

    if (!budget || parseFloat(budget) <= 0) {
      showAlert('Please enter a valid budget.', 'alert-error');
      return;
    }

    const inventoryList = visibleInventory.map(item => `${item.name} (${item.quantity} ${item.unit})`).join(', ');

    setLoading(true);
    setSuggestions(null);

    const prompt = `You are a smart shopping assistant. I have a budget of R${budget} for ${mealPlan === 'week' ? 'a week' : mealPlan === 'month' ? 'a month' : '3 days'}.
I already have these ingredients: ${inventoryList || 'nothing'}.
${preferences ? `My dietary preferences: ${preferences}.` : ''}
Please suggest what I should buy to complete my meals and stay within budget.
Focus on essential ingredients that can be used in multiple recipes.
Format your response as JSON with these fields:
{
  "summary": "Brief summary of the shopping plan",
  "totalEstimatedCost": "Total estimated cost",
  "shoppingList": [
    {
      "item": "Item name",
      "quantity": "Quantity to buy",
      "estimatedPrice": "Estimated price in R",
      "reason": "Why this item is needed"
    }
  ],
  "mealSuggestions": [
    {
      "name": "Meal name",
      "usesExistingIngredients": ["ingredient 1", "ingredient 2"],
      "needsNewIngredients": ["ingredient 1", "ingredient 2"]
    }
  ],
  "moneySavingTips": ["tip 1", "tip 2", "tip 3"]
}`;

    let retries = 3;
    let lastError = null;

    while (retries > 0) {
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
              { role: 'system', content: 'You are a helpful shopping assistant that provides shopping suggestions in JSON format with South African pricing in mind.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);
        
        setSuggestions(result);
        showAlert('Shopping suggestions generated!');
        return;
      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    console.error('Error generating suggestions:', lastError);
    showAlert(`Failed to generate suggestions after retries: ${lastError.message}`, 'alert-error');
    setLoading(false);
  };

  return (
    <main>
      <div className="page-hero">
        <h1>MealMate <em>Shopping Suggestions</em></h1>
        <p>AI-powered shopping lists based on your budget and inventory</p>
      </div>
      {alert.show && <div className={`alert show ${alert.type}`}>{alert.msg}</div>}

      <div className="layout">

        {/* ── BUDGET INPUT ── */}
        <div className="card">
          <div className="card-title">Your Budget</div>
          
          <div className="field">
            <label>Budget (R)</label>
            <input
              type="number"
              placeholder="500"
              min="0"
              step="10"
              value={budget}
              onChange={e => setBudget(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Shopping Period</label>
            <select value={mealPlan} onChange={e => setMealPlan(e.target.value)}>
              <option value="3days">3 Days</option>
              <option value="week">1 Week</option>
              <option value="month">1 Month</option>
            </select>
          </div>

          <div className="field">
            <label>Dietary Preferences (optional)</label>
            <textarea
              placeholder="e.g. vegetarian, no dairy, low carb, etc."
              value={preferences}
              onChange={e => setPreferences(e.target.value)}
              rows={3}
            />
          </div>

          <button
            className="btn"
            onClick={generateSuggestions}
            disabled={loading || !budget}
            style={{ marginTop: '20px', width: '100%' }}
          >
            {loading ? 'Generating Suggestions...' : '🛒 Generate Shopping List'}
          </button>
        </div>

        {/* ── CURRENT INVENTORY SUMMARY ── */}
        <div className="card">
          <div className="card-title">Your Current Inventory</div>
          <div className="table-top">
            <span className="badge-count">{visibleInventory.length} items</span>
          </div>
          {visibleInventory.length === 0 ? (
            <p style={{ padding: '20px', color: 'var(--muted)' }}>No items in inventory. Add items first.</p>
          ) : (
            <div className="inventory-summary">
              {visibleInventory.slice(0, 10).map(item => (
                <div key={item.itemID} className="summary-item">
                  <span>{item.name}</span>
                  <span>{item.quantity} {item.unit}</span>
                </div>
              ))}
              {visibleInventory.length > 10 && (
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>+{visibleInventory.length - 10} more items</p>
              )}
            </div>
          )}
        </div>

        {/* ── GENERATED SUGGESTIONS ── */}
        {suggestions && (
          <div className="card suggestions-card">
            <div className="card-title">Shopping Suggestions</div>
            
            <div className="suggestions-summary">
              <h3>📋 Summary</h3>
              <p>{suggestions.summary}</p>
              <div className="budget-highlight">
                <strong>Total Estimated Cost: {suggestions.totalEstimatedCost}</strong>
              </div>
            </div>

            <div className="suggestions-section">
              <h3>🛒 Shopping List</h3>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Est. Price</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.shoppingList.map((item, idx) => (
                    <tr key={idx}>
                      <td><strong>{item.item}</strong></td>
                      <td>{item.quantity}</td>
                      <td className="amount-cell">{item.estimatedPrice}</td>
                      <td>{item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="suggestions-section">
              <h3>🍽️ Suggested Meals</h3>
              {suggestions.mealSuggestions.map((meal, idx) => (
                <div key={idx} className="meal-suggestion">
                  <h4>{meal.name}</h4>
                  <div className="meal-details">
                    <div>
                      <strong>✅ Uses:</strong> {meal.usesExistingIngredients.join(', ')}
                    </div>
                    <div>
                      <strong>➕ Needs:</strong> {meal.needsNewIngredients.join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="suggestions-section tips-section">
              <h3>💡 Money-Saving Tips</h3>
              <ul>
                {suggestions.moneySavingTips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default ShoppingSuggestions;
