import React, { useState } from 'react';
import '../App.css';

const GROQ_API_KEY = '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';

function RecipeGenerator({ users = [], currentUser = {} }) {
  const [inventory] = useState(() => {
    try { const s = localStorage.getItem('mm_inventory'); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });

  const [recipes, setRecipes] = useState(() => {
    try { const s = localStorage.getItem('mm_recipes'); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });

  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [mealType, setMealType] = useState('any');
  const [servings, setServings] = useState('2');
  const [loading, setLoading] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [alert, setAlert] = useState({ show: false, msg: '', type: '' });

  const isAdmin = currentUser.role === 'admin';
  const visibleInventory = isAdmin
    ? inventory
    : inventory.filter(item => item.userID === currentUser.userID);

  const showAlert = (msg, type = 'alert-success') => {
    setAlert({ show: true, msg, type });
    setTimeout(() => setAlert({ show: false, msg: '', type: '' }), 4000);
  };

  const toggleIngredient = (itemID) => {
    setSelectedIngredients(prev =>
      prev.includes(itemID) ? prev.filter(id => id !== itemID) : [...prev, itemID]
    );
  };

  const selectAll = () => {
    setSelectedIngredients(visibleInventory.map(item => item.itemID));
  };

  const clearSelection = () => {
    setSelectedIngredients([]);
  };

  const generateRecipe = async () => {

    if (selectedIngredients.length === 0) {
      showAlert('Please select at least one ingredient.', 'alert-error');
      return;
    }

    const selectedItems = visibleInventory.filter(item => selectedIngredients.includes(item.itemID));
    const ingredientsList = selectedItems.map(item => `${item.name} (${item.quantity} ${item.unit})`).join(', ');

    setLoading(true);
    setGeneratedRecipe(null);

    const prompt = `You are a helpful cooking assistant. I have these ingredients: ${ingredientsList}. 
Please generate a ${mealType !== 'any' ? mealType : 'meal'} recipe for ${servings} people using these ingredients.
The recipe should be practical and use as many of the available ingredients as possible.
If additional ingredients are needed, list them as "You'll also need: [ingredients]".
Format your response as JSON with these fields:
{
  "title": "Recipe name",
  "description": "Brief description",
  "prepTime": "Preparation time",
  "cookTime": "Cooking time",
  "servings": "Number of servings",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": ["step 1", "step 2", ...],
  "additionalNeeded": ["ingredient 1", "ingredient 2", ...]
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
              { role: 'system', content: 'You are a helpful cooking assistant that provides recipes in JSON format.' },
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
        const recipe = JSON.parse(data.choices[0].message.content);
        
        setGeneratedRecipe(recipe);
        showAlert('Recipe generated successfully!');
        return;
      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    console.error('Error generating recipe:', lastError);
    showAlert(`Failed to generate recipe after retries: ${lastError.message}`, 'alert-error');
    setLoading(false);
  };

  const saveRecipe = () => {
    if (!generatedRecipe) return;
    
    const newRecipe = {
      recipeID: Date.now(),
      userID: currentUser.userID,
      ...generatedRecipe,
      usedIngredients: selectedIngredients,
      createdAt: new Date().toISOString()
    };
    
    setRecipes(prev => [newRecipe, ...prev]);
    localStorage.setItem('mm_recipes', JSON.stringify([newRecipe, ...recipes]));
    showAlert('Recipe saved!');
  };

  return (
    <main>
      <div className="page-hero">
        <h1>MealMate <em>Recipe Generator</em></h1>
        <p>AI-powered recipes based on your inventory</p>
      </div>
      {alert.show && <div className={`alert show ${alert.type}`}>{alert.msg}</div>}

      <div className="layout">

        {/* ── INGREDIENT SELECTION ── */}
        <div className="card">
          <div className="card-title">Select Ingredients</div>
          <div className="table-top">
            <span className="badge-count">{selectedIngredients.length} selected</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-small" onClick={selectAll}>Select All</button>
              <button className="btn-small" onClick={clearSelection}>Clear</button>
            </div>
          </div>
          
          {visibleInventory.length === 0 ? (
            <p style={{ padding: '20px', color: 'var(--muted)' }}>No items in inventory. Add items first.</p>
          ) : (
            <div className="ingredient-grid">
              {visibleInventory.map(item => (
                <div
                  key={item.itemID}
                  className={`ingredient-card ${selectedIngredients.includes(item.itemID) ? 'selected' : ''}`}
                  onClick={() => toggleIngredient(item.itemID)}
                >
                  <div className="ingredient-name">{item.name}</div>
                  <div className="ingredient-qty">{item.quantity} {item.unit}</div>
                  <div className="ingredient-loc">{item.locationID === 1 ? '🧊' : item.locationID === 2 ? '🗄️' : item.locationID === 3 ? '📦' : '❄️'}</div>
                </div>
              ))}
            </div>
          )}

          <div className="row2" style={{ marginTop: '20px' }}>
            <div className="field">
              <label>Meal Type</label>
              <select value={mealType} onChange={e => setMealType(e.target.value)}>
                <option value="any">Any</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            <div className="field">
              <label>Servings</label>
              <select value={servings} onChange={e => setServings(e.target.value)}>
                <option value="1">1 person</option>
                <option value="2">2 people</option>
                <option value="4">4 people</option>
                <option value="6">6 people</option>
              </select>
            </div>
          </div>

          <button
            className="btn"
            onClick={generateRecipe}
            disabled={loading || selectedIngredients.length === 0}
            style={{ marginTop: '20px', width: '100%' }}
          >
            {loading ? 'Generating Recipe...' : '🧑‍🍳 Generate Recipe'}
          </button>
        </div>

        {/* ── GENERATED RECIPE ── */}
        {generatedRecipe && (
          <div className="card recipe-card">
            <div className="card-title">Generated Recipe</div>
            <h2>{generatedRecipe.title}</h2>
            <p className="recipe-description">{generatedRecipe.description}</p>
            
            <div className="recipe-meta">
              <span>⏱️ Prep: {generatedRecipe.prepTime}</span>
              <span>🍳 Cook: {generatedRecipe.cookTime}</span>
              <span>👥 Serves: {generatedRecipe.servings}</span>
            </div>

            <div className="recipe-section">
              <h3>Ingredients</h3>
              <ul>
                {generatedRecipe.ingredients.map((ing, idx) => (
                  <li key={idx}>{ing}</li>
                ))}
              </ul>
            </div>

            {generatedRecipe.additionalNeeded && generatedRecipe.additionalNeeded.length > 0 && (
              <div className="recipe-section additional">
                <h3>🛒 You'll also need</h3>
                <ul>
                  {generatedRecipe.additionalNeeded.map((ing, idx) => (
                    <li key={idx}>{ing}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="recipe-section">
              <h3>Instructions</h3>
              <ol>
                {generatedRecipe.instructions.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>

            <button className="btn" onClick={saveRecipe} style={{ marginTop: '20px' }}>
              💾 Save Recipe
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default RecipeGenerator;
