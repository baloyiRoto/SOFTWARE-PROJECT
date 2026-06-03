import React, { useState, useEffect } from 'react';
import '../App.css';

const GROQ_API_KEY = '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';

function ShoppingSuggestions({ users = [], currentUser = {} }) {
  const [inventory] = useState(() => {
    try { const s = localStorage.getItem('mm_inventory'); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });

  const [expenses] = useState(() => {
    try { const s = localStorage.getItem('ss_expenses'); return s ? JSON.parse(s) : []; }
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
  
  const userExpenses = isAdmin
    ? expenses
    : expenses.filter(expense => expense.userID === currentUser.userID);

  // Detect low inventory items and predict what will run out soon
  const lowInventoryItems = visibleInventory.filter(item => {
    // Consider items with quantity <= 1 as low
    return item.quantity <= 1;
  });

  // Predict items that will run out soon based on usage patterns
  const [predictedNeeds, setPredictedNeeds] = useState(null);
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  const generatePredictiveShopping = async () => {
    setLoadingPredictions(true);
    
    const inventorySummary = visibleInventory.map(item => 
      `${item.name} (${item.quantity} ${item.unit}, expires: ${item.expiryDate || 'N/A'})`
    ).join('\n');
    
    const prompt = `You are a predictive shopping assistant. Analyze this inventory data:

Current Inventory:
${inventorySummary}

Based on typical student usage patterns and the current inventory levels, predict which items will need to be restocked soon.
Consider:
1. Items with low quantities (<= 1 unit)
2. Items expiring soon (within 7 days)
3. Essential staples that students frequently use
4. Items that are commonly used together in recipes

Format your response as JSON:
{
  "predictions": [
    {
      "item": "item name",
      "currentQuantity": "current amount",
      "predictedNeed": "high/medium/low",
      "reason": "why this item will be needed soon",
      "suggestedRestockAmount": "amount to buy",
      "urgency": "immediate/soon/later"
    }
  ],
  "summary": "Brief summary of predictive analysis"
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
            { role: 'system', content: 'You are a predictive shopping assistant that provides inventory predictions in JSON format.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPredictedNeeds(JSON.parse(data.choices[0].message.content));
        showAlert('Predictive shopping analysis generated!');
      }
    } catch (error) {
      console.error('Error generating predictions:', error);
      showAlert('Failed to generate predictions. Please try again.', 'alert-error');
    } finally {
      setLoadingPredictions(false);
    }
  };

  const [showLowInventoryAlert, setShowLowInventoryAlert] = useState(false);

  // Show alert when inventory is low
  useEffect(() => {
    if (lowInventoryItems.length > 0 && !showLowInventoryAlert) {
      setShowLowInventoryAlert(true);
    }
  }, [lowInventoryItems.length, showLowInventoryAlert]);

  const generateRestockSuggestions = async () => {
    if (lowInventoryItems.length === 0) {
      showAlert('No low inventory items detected.', 'alert-error');
      return;
    }

    const lowItemsList = lowInventoryItems.map(item => `${item.name} (currently: ${item.quantity} ${item.unit})`).join(', ');
    
    // Analyze user's purchase patterns from expenses - ONLY food category (categoryID: 1)
    const purchasePatterns = {};
    userExpenses.forEach(expense => {
      // Only include food expenses (categoryID: 1) for shopping suggestions
      if (expense.categoryID === 1) {
        const key = expense.description.toLowerCase();
        purchasePatterns[key] = (purchasePatterns[key] || 0) + expense.amount;
      }
    });
    
    // Get top purchased items
    const topPurchases = Object.entries(purchasePatterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([item, amount]) => ({ item, amount }));
    
    const frequentPurchases = topPurchases.map(p => p.item).join(', ');

    setLoading(true);
    setSuggestions(null);

    const prompt = `You are a smart shopping assistant for groceries and food items ONLY. The following items in my inventory are running low: ${lowItemsList}.

Based on my food purchase history, I frequently buy: ${frequentPurchases || 'no food purchase history yet'}.
${preferences ? `My dietary preferences: ${preferences}.` : ''}

IMPORTANT: Only suggest FOOD and GROCERY items for restocking. DO NOT suggest:
- Transport (taxi, bus, fuel)
- Rent or accommodation
- Stationery or school supplies
- Entertainment or subscriptions
- Data or internet services
- Any non-food items

Please suggest what I should restock to replenish my inventory.
Focus on:
1. Food items that are running low
2. Food items I frequently buy (based on my food purchase patterns)
3. Cost-effective bulk buying options for groceries
4. Food items that complement what I still have in inventory

Format your response as JSON with these fields:
{
  "summary": "Brief summary of the restocking plan",
  "totalEstimatedCost": "Total estimated cost",
  "shoppingList": [
    {
      "item": "Food item name",
      "quantity": "Quantity to buy",
      "estimatedPrice": "Estimated price in R",
      "reason": "Why this item is needed (mention if it's running low or frequently purchased)",
      "isRestock": true/false
    }
  ],
  "moneySavingTips": ["tip 1", "tip 2", "tip 3"],
  "restockInsights": ["insight about inventory levels", "suggestion for bulk buying"]
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
              { role: 'system', content: 'You are a helpful shopping assistant that provides FOOD AND GROCERY restocking suggestions in JSON format with South African pricing in mind. Analyze inventory levels and food purchase patterns to provide relevant recommendations. NEVER suggest non-food items like transport, rent, stationery, entertainment, or data services.' },
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
        setLoading(false);
        setShowLowInventoryAlert(false);
        showAlert('Restock suggestions generated!');
        return;
      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    console.error('Error generating restock suggestions:', lastError);
    showAlert(`Failed to generate restock suggestions after retries: ${lastError.message}`, 'alert-error');
    setLoading(false);
  };

  // Load/save suggestions per user
  useEffect(() => {
    if (currentUser.userID) {
      try {
        const key = `mm_suggestions_${currentUser.userID}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          setSuggestions(JSON.parse(saved));
        } else {
          setSuggestions(null);
        }
      } catch {
        setSuggestions(null);
      }
    }
  }, [currentUser.userID]);

  useEffect(() => {
    if (currentUser.userID && suggestions) {
      try {
        const key = `mm_suggestions_${currentUser.userID}`;
        localStorage.setItem(key, JSON.stringify(suggestions));
      } catch {
        // Ignore storage errors
      }
    }
  }, [suggestions, currentUser.userID]);

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
    
    // Analyze user's purchase patterns from expenses - ONLY food category (categoryID: 1)
    const purchasePatterns = {};
    userExpenses.forEach(expense => {
      // Only include food expenses (categoryID: 1) for shopping suggestions
      if (expense.categoryID === 1) {
        const key = expense.description.toLowerCase();
        purchasePatterns[key] = (purchasePatterns[key] || 0) + expense.amount;
      }
    });
    
    // Get top purchased items
    const topPurchases = Object.entries(purchasePatterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([item, amount]) => ({ item, amount }));
    
    const frequentPurchases = topPurchases.map(p => p.item).join(', ');

    setLoading(true);
    setSuggestions(null);

    const prompt = `You are a smart shopping assistant for groceries and food items ONLY. I have a budget of R${budget} for ${mealPlan === 'week' ? 'a week' : mealPlan === 'month' ? 'a month' : '3 days'}.
I already have these ingredients: ${inventoryList || 'nothing'}.

Based on my food purchase history, I frequently buy: ${frequentPurchases || 'no food purchase history yet'}.
${preferences ? `My dietary preferences: ${preferences}.` : ''}

IMPORTANT: Only suggest FOOD and GROCERY items. DO NOT suggest:
- Transport (taxi, bus, fuel)
- Rent or accommodation
- Stationery or school supplies
- Entertainment or subscriptions
- Data or internet services
- Any non-food items

Please suggest what I should buy to complete my meals and stay within budget.
Focus on:
1. Food items I frequently buy (based on my food purchase patterns)
2. Essential ingredients that can be used in multiple recipes
3. Items that complement what I already have in inventory
4. Cost-effective alternatives if my frequent purchases are expensive

Format your response as JSON with these fields:
{
  "summary": "Brief summary of the shopping plan considering your food purchase patterns",
  "totalEstimatedCost": "Total estimated cost",
  "shoppingList": [
    {
      "item": "Food item name",
      "quantity": "Quantity to buy",
      "estimatedPrice": "Estimated price in R",
      "reason": "Why this item is needed (mention if it's based on food purchase patterns)",
      "isFrequentPurchase": true/false
    }
  ],
  "mealSuggestions": [
    {
      "name": "Meal name",
      "usesExistingIngredients": ["ingredient 1", "ingredient 2"],
      "needsNewIngredients": ["ingredient 1", "ingredient 2"],
      "basedOnPreferences": "Explain how this meal matches user's preferences"
    }
  ],
  "moneySavingTips": ["tip 1", "tip 2", "tip 3"],
  "patternInsights": ["insight about user's food spending patterns", "suggestion based on patterns"]
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
              { role: 'system', content: 'You are a helpful shopping assistant that provides personalized FOOD AND GROCERY shopping suggestions in JSON format with South African pricing in mind. Analyze user food purchase patterns to provide relevant recommendations. NEVER suggest non-food items like transport, rent, stationery, entertainment, or data services.' },
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
        setLoading(false);
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

      {showLowInventoryAlert && lowInventoryItems.length > 0 && (
        <div style={{ maxWidth: '800px', margin: '0 auto 24px auto', padding: '0 20px' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: 'white' }}>
            <div className="card-title" style={{ color: 'white', borderBottom: 'none' }}>⚠️ Low Inventory Alert</div>
            <div style={{ marginTop: '12px', fontSize: '0.9rem' }}>
              <p style={{ marginBottom: '12px' }}>You have {lowInventoryItems.length} item(s) running low:</p>
              <ul style={{ marginBottom: '12px', paddingLeft: '20px' }}>
                {lowInventoryItems.slice(0, 5).map(item => (
                  <li key={item.itemID}>{item.name} ({item.quantity} {item.unit})</li>
                ))}
                {lowInventoryItems.length > 5 && <li>+{lowInventoryItems.length - 5} more items</li>}
              </ul>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  className="btn" 
                  onClick={generateRestockSuggestions}
                  disabled={loading}
                  style={{ background: 'white', color: '#ea580c', marginTop: '8px' }}
                >
                  {loading ? 'Generating...' : '🛒 Generate Restock List'}
                </button>
                <button 
                  className="btn" 
                  onClick={generatePredictiveShopping}
                  disabled={loadingPredictions}
                  style={{ background: 'white', color: '#ea580c', marginTop: '8px' }}
                >
                  {loadingPredictions ? 'Analyzing...' : '🔮 AI Predictive Analysis'}
                </button>
                <button 
                  className="btn" 
                  onClick={() => setShowLowInventoryAlert(false)}
                  style={{ background: 'transparent', border: '1px solid white', color: 'white', marginTop: '8px' }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PREDICTIVE SHOPPING PANEL ── */}
      {predictedNeeds && (
        <div style={{ maxWidth: '800px', margin: '0 auto 24px auto', padding: '0 20px' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <div className="card-title" style={{ color: 'white', borderBottom: 'none' }}>🔮 AI Predictive Shopping Analysis</div>
            <div style={{ marginTop: '16px' }}>
              <p style={{ marginBottom: '16px', fontSize: '0.95rem' }}>{predictedNeeds.summary}</p>
              
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>Predicted Needs:</h4>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {predictedNeeds.predictions.map((pred, idx) => (
                    <div key={idx} style={{ 
                      background: 'rgba(255,255,255,0.1)', 
                      padding: '12px', 
                      borderRadius: '6px',
                      borderLeft: pred.urgency === 'immediate' ? '4px solid #ef4444' : 
                                 pred.urgency === 'soon' ? '4px solid #f59e0b' : '4px solid #22c55e'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <strong>{pred.item}</strong>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          padding: '2px 8px', 
                          borderRadius: '4px',
                          background: pred.urgency === 'immediate' ? '#ef4444' : 
                                     pred.urgency === 'soon' ? '#f59e0b' : '#22c55e'
                        }}>
                          {pred.urgency.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                        <strong>Current:</strong> {pred.currentQuantity} | <strong>Need:</strong> {pred.predictedNeed}
                      </div>
                      <div style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                        <strong>Suggested Restock:</strong> {pred.suggestedRestockAmount}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                        {pred.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <button 
                className="btn" 
                onClick={() => setPredictedNeeds(null)}
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', marginTop: '16px', width: '100%' }}
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}

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
                    <tr key={idx} style={item.isFrequentPurchase ? { background: '#f0fdf4' } : {}}>
                      <td>
                        <strong>{item.item}</strong>
                        {item.isFrequentPurchase && <span style={{ marginLeft: 8, fontSize: '0.75rem', background: '#22c55e', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>Frequent</span>}
                      </td>
                      <td>{item.quantity}</td>
                      <td className="amount-cell">{item.estimatedPrice}</td>
                      <td>{item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {suggestions.mealSuggestions && suggestions.mealSuggestions.length > 0 && (
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
                      {meal.basedOnPreferences && (
                        <div style={{ marginTop: 8, padding: 8, background: '#fef3c7', borderRadius: 4, fontSize: '0.85rem' }}>
                          <strong>💭 Matches your preferences:</strong> {meal.basedOnPreferences}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {suggestions.patternInsights && (
              <div className="suggestions-section tips-section" style={{ background: '#f0f9ff' }}>
                <h3>📊 Your Purchase Patterns</h3>
                <ul>
                  {suggestions.patternInsights.map((insight, idx) => (
                    <li key={idx}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}

            {suggestions.restockInsights && (
              <div className="suggestions-section tips-section" style={{ background: '#fef3c7' }}>
                <h3>📦 Restock Insights</h3>
                <ul>
                  {suggestions.restockInsights.map((insight, idx) => (
                    <li key={idx}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}

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
