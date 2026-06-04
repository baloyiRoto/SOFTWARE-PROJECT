import React, { useState, useEffect } from 'react';
import '../App.css';

const GROQ_API_KEY = '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';

function RecipeGenerator({ users = [], currentUser = {} }) {
  const [inventory, setInventory] = useState(() => {
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
  const [savedRecipesOpen, setSavedRecipesOpen] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [expandedLocations, setExpandedLocations] = useState({});
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('all');

  const isAdmin = currentUser.role === 'admin';
  const visibleInventory = isAdmin
    ? inventory
    : inventory.filter(item => item.userID === currentUser.userID);

  useEffect(() => {
    localStorage.setItem('mm_inventory', JSON.stringify(inventory));
  }, [inventory]);

  const showAlert = (msg, type = 'alert-success') => {
    setAlert({ show: true, msg, type });
    setTimeout(() => setAlert({ show: false, msg: '', type: '' }), 4000);
  };

  const useRecipe = async () => {
    if (!generatedRecipe) return;
    
    setLoading(true);
    
    try {
      // Use AI to parse ingredients and extract quantities
      const prompt = `Parse these recipe ingredients and extract the item names and quantities needed:
${generatedRecipe.ingredients.join('\n')}

Return JSON in this format:
{
  "items": [
    {"name": "item name", "quantity": number, "unit": "unit"}
  ]
}`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that parses recipe ingredients and extracts item names and quantities in JSON format.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        
        // Update inventory by reducing quantities
        const updatedInventory = inventory.map(item => {
          const usedItem = parsed.items.find(p => 
            p.name.toLowerCase().includes(item.name.toLowerCase()) || 
            item.name.toLowerCase().includes(p.name.toLowerCase())
          );
          
          if (usedItem) {
            const newQuantity = Math.max(0, item.quantity - usedItem.quantity);
            return { ...item, quantity: newQuantity };
          }
          return item;
        });
        
        setInventory(updatedInventory);
        showAlert('Inventory updated! Quantities reduced based on recipe.');
      }
    } catch (error) {
      console.error('Error using recipe:', error);
      showAlert('Failed to update inventory. Please try again.', 'alert-error');
    } finally {
      setLoading(false);
    }
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
Please generate a ${mealType !== 'any' ? mealType : 'meal'} recipe for ${servings} people using ONLY these ingredients.
The recipe must be practical and use as many of the available ingredients as possible.
CRITICAL: DO NOT suggest any additional ingredients that are not in the list. The recipe should work with what the user has.
DO NOT include phrases like "you'll also need" or "you might want to add". Use ONLY the ingredients listed.
If it's not possible to make a complete meal with only these ingredients, suggest the best possible dish using what's available.
Format your response as JSON with these fields:
{
  "title": "Recipe name",
  "description": "Brief description",
  "prepTime": "Preparation time",
  "cookTime": "Cooking time",
  "servings": "Number of servings",
  "ingredients": ["ingredient 1 with quantity from inventory", "ingredient 2 with quantity from inventory", ...],
  "instructions": ["step 1", "step 2", ...]
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
        setLoading(false);
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
    
    const isDuplicate = userRecipes.some(recipe => 
      recipe.title.toLowerCase() === generatedRecipe.title.toLowerCase()
    );
    
    if (isDuplicate) {
      showAlert('This recipe already exists in your saved recipes!', 'alert-error');
      return;
    }
    
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

  const deleteRecipe = (recipeID) => {
    setRecipes(prev => prev.filter(recipe => recipe.recipeID !== recipeID));
    localStorage.setItem('mm_recipes', JSON.stringify(recipes.filter(recipe => recipe.recipeID !== recipeID)));
    showAlert('Recipe removed!');
  };

  const viewRecipe = (recipe) => {
    setExpandedRecipeId(recipe.recipeID);
  };

  const closeRecipeView = () => {
    setExpandedRecipeId(null);
  };

  const userRecipes = recipes.filter(recipe => recipe.userID === currentUser.userID);

  const LOCATIONS = { 1: 'Fridge', 2: 'Cupboard', 3: 'Pantry', 4: 'Freezer' };

  const filteredInventory = visibleInventory.filter(item => 
    item.name.toLowerCase().includes(ingredientSearch.toLowerCase()) &&
    (selectedLocationFilter === 'all' || item.locationID === parseInt(selectedLocationFilter))
  );

  const groupedInventory = filteredInventory.reduce((groups, item) => {
    const location = LOCATIONS[item.locationID];
    if (!groups[location]) {
      groups[location] = [];
    }
    groups[location].push(item);
    return groups;
  }, {});

  const toggleLocationExpansion = (location) => {
    setExpandedLocations(prev => ({
      ...prev,
      [location]: !prev[location]
    }));
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

          {/* Location Filter Buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: '16px', flexWrap: 'wrap' }}>
            <button
              className={`btn-small ${selectedLocationFilter === 'all' ? 'btn' : ''}`}
              onClick={() => setSelectedLocationFilter('all')}
              style={{
                background: selectedLocationFilter === 'all' ? 'var(--purple)' : 'var(--bg)',
                color: selectedLocationFilter === 'all' ? 'white' : 'var(--text)',
                border: '1px solid var(--border)'
              }}
            >
              🏠 All Locations
            </button>
            <button
              className={`btn-small ${selectedLocationFilter === '1' ? 'btn' : ''}`}
              onClick={() => setSelectedLocationFilter('1')}
              style={{
                background: selectedLocationFilter === '1' ? 'var(--purple)' : 'var(--bg)',
                color: selectedLocationFilter === '1' ? 'white' : 'var(--text)',
                border: '1px solid var(--border)'
              }}
            >
              🧊 Fridge
            </button>
            <button
              className={`btn-small ${selectedLocationFilter === '2' ? 'btn' : ''}`}
              onClick={() => setSelectedLocationFilter('2')}
              style={{
                background: selectedLocationFilter === '2' ? 'var(--purple)' : 'var(--bg)',
                color: selectedLocationFilter === '2' ? 'white' : 'var(--text)',
                border: '1px solid var(--border)'
              }}
            >
              🗄️ Cupboard
            </button>
            <button
              className={`btn-small ${selectedLocationFilter === '3' ? 'btn' : ''}`}
              onClick={() => setSelectedLocationFilter('3')}
              style={{
                background: selectedLocationFilter === '3' ? 'var(--purple)' : 'var(--bg)',
                color: selectedLocationFilter === '3' ? 'white' : 'var(--text)',
                border: '1px solid var(--border)'
              }}
            >
              📦 Pantry
            </button>
            <button
              className={`btn-small ${selectedLocationFilter === '4' ? 'btn' : ''}`}
              onClick={() => setSelectedLocationFilter('4')}
              style={{
                background: selectedLocationFilter === '4' ? 'var(--purple)' : 'var(--bg)',
                color: selectedLocationFilter === '4' ? 'white' : 'var(--text)',
                border: '1px solid var(--border)'
              }}
            >
              ❄️ Freezer
            </button>
          </div>

          <div className="field" style={{ marginTop: '16px' }}>
            <input
              type="text"
              placeholder="Search ingredients..."
              value={ingredientSearch}
              onChange={e => setIngredientSearch(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}
            />
          </div>
          
          {visibleInventory.length === 0 ? (
            <p style={{ padding: '20px', color: 'var(--muted)' }}>No items in inventory. Add items first.</p>
          ) : (
            Object.entries(groupedInventory).map(([location, items]) => {
              const isExpanded = expandedLocations[location] || false;
              const visibleItems = isExpanded ? items : items.slice(0, 2);
              const hasMore = items.length > 2;
              
              return (
                <div key={location} style={{ marginTop: '20px' }}>
                  <div 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      marginBottom: '12px'
                    }}
                    onClick={() => hasMore && toggleLocationExpansion(location)}
                  >
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--purple-dark)', fontWeight: 600, margin: 0 }}>
                      {location} ({items.length})
                    </h4>
                    {hasMore && (
                      <span style={{ fontSize: '1rem', color: 'var(--purple)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        ▼
                      </span>
                    )}
                  </div>
                  <div className="ingredient-grid">
                    {visibleItems.map(item => (
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
                  {hasMore && !isExpanded && (
                    <button 
                      className="btn-small" 
                      onClick={() => toggleLocationExpansion(location)}
                      style={{ marginTop: '8px', width: '100%' }}
                    >
                      Show {items.length - 2} more
                    </button>
                  )}
                </div>
              );
            })
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
        <div className="card recipe-card">
          <div className="card-title">Generated Recipe</div>
          {generatedRecipe ? (
            <>
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

              <div className="recipe-section">
                <h3>Instructions</h3>
                <ol>
                  {generatedRecipe.instructions.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                <button className="btn" onClick={saveRecipe}>
                  💾 Save Recipe
                </button>
                <button 
                  className="btn" 
                  onClick={useRecipe}
                  disabled={loading}
                  style={{ background: '#22c55e' }}
                >
                  {loading ? 'Updating...' : '🍳 Use Recipe (Reduce Inventory)'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🧑‍🍳</div>
              <p style={{ fontSize: '1rem', marginBottom: '8px' }}>No recipe generated yet</p>
              <p style={{ fontSize: '0.88rem' }}>Select ingredients and click "Generate Recipe" to get started</p>
            </div>
          )}
        </div>

        {/* ── SAVED RECIPES ── */}
        <div className="card saved-recipes-card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setSavedRecipesOpen(!savedRecipesOpen)}>
            <span>Saved Recipes ({userRecipes.length})</span>
            <span style={{ fontSize: '1.2rem', transition: 'transform 0.2s', transform: savedRecipesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
          </div>
          {savedRecipesOpen && (
            <div style={{ marginTop: '20px' }}>
              {userRecipes.length === 0 ? (
                <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px' }}>No saved recipes yet. Generate and save your first recipe!</p>
              ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                  {userRecipes.map(recipe => (
                    <div key={recipe.recipeID} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', background: 'var(--bg)' }}>
                      {expandedRecipeId === recipe.recipeID ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 600, color: 'var(--purple-dark)', margin: 0 }}>{recipe.title}</h2>
                            <button 
                              className="btn-small" 
                              onClick={closeRecipeView}
                              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                            >
                              ✕ Close
                            </button>
                          </div>
                          <p className="recipe-description" style={{ marginBottom: '16px' }}>{recipe.description}</p>
                          
                          <div className="recipe-meta" style={{ marginBottom: '16px' }}>
                            <span>⏱️ Prep: {recipe.prepTime}</span>
                            <span>🍳 Cook: {recipe.cookTime}</span>
                            <span>👥 Serves: {recipe.servings}</span>
                          </div>

                          <div className="recipe-section" style={{ marginBottom: '16px' }}>
                            <h3>Ingredients</h3>
                            <ul>
                              {recipe.ingredients.map((ing, idx) => (
                                <li key={idx}>{ing}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="recipe-section">
                            <h3>Instructions</h3>
                            <ol>
                              {recipe.instructions.map((step, idx) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ol>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                            <button 
                              className="btn-small" 
                              onClick={() => deleteRecipe(recipe.recipeID)}
                              style={{ background: 'var(--error-bg)', color: '#e11d48' }}
                            >
                              Remove Recipe
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 600, color: 'var(--purple-dark)', marginBottom: '8px' }}>{recipe.title}</h3>
                          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '12px' }}>{recipe.description}</p>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '12px' }}>
                            <span>⏱️ {recipe.prepTime}</span>
                            <span>🍳 {recipe.cookTime}</span>
                            <span>👥 {recipe.servings}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button 
                              className="btn-small" 
                              onClick={() => viewRecipe(recipe)}
                            >
                              View Recipe
                            </button>
                            <button 
                              className="btn-small" 
                              onClick={() => deleteRecipe(recipe.recipeID)}
                              style={{ background: 'var(--error-bg)', color: '#e11d48' }}
                            >
                              Remove
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default RecipeGenerator;
