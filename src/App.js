import React, { useState, useEffect } from 'react';
import './App.css';

// Calorie calculation constants
const CALORIES_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fats: 9
};

const calculateCalories = (protein, carbs, fats) => {
  return Math.round(
    (protein * CALORIES_PER_GRAM.protein) +
    (carbs * CALORIES_PER_GRAM.carbs) +
    (fats * CALORIES_PER_GRAM.fats)
  );
};

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const App = () => {
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [meals, setMeals] = useState(
    MEAL_TYPES.reduce((acc, meal) => ({ ...acc, [meal]: [] }), {})
  );
  const [activeTab, setActiveTab] = useState('ingredients');

  // Load data from localStorage
  useEffect(() => {
    const savedIngredients = JSON.parse(localStorage.getItem('ingredients') || '[]');
    const savedRecipes = JSON.parse(localStorage.getItem('recipes') || '[]');
    const savedMeals = JSON.parse(localStorage.getItem('meals') || 'null') || 
      MEAL_TYPES.reduce((acc, meal) => ({ ...acc, [meal]: [] }), {});
    
    setIngredients(savedIngredients);
    setRecipes(savedRecipes);
    setMeals(savedMeals);
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('ingredients', JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem('recipes', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('meals', JSON.stringify(meals));
  }, [meals]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🥗 MacroChef</h1>
        <p>Track your recipes and macros with precision</p>
      </header>

      <nav className="tab-navigation">
        <button 
          className={activeTab === 'ingredients' ? 'active' : ''} 
          onClick={() => setActiveTab('ingredients')}
        >
          Ingredients
        </button>
        <button 
          className={activeTab === 'recipes' ? 'active' : ''} 
          onClick={() => setActiveTab('recipes')}
        >
          Recipes
        </button>
        <button 
          className={activeTab === 'diet' ? 'active' : ''} 
          onClick={() => setActiveTab('diet')}
        >
          My Diet
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'ingredients' && (
          <IngredientsTab 
            ingredients={ingredients} 
            setIngredients={setIngredients} 
          />
        )}
        {activeTab === 'recipes' && (
          <RecipesTab 
            recipes={recipes} 
            setRecipes={setRecipes} 
            ingredients={ingredients} 
          />
        )}
        {activeTab === 'diet' && (
          <DietTab 
            meals={meals}
            setMeals={setMeals}
            recipes={recipes}
            ingredients={ingredients}
          />
        )}
      </main>
    </div>
  );
};

// Ingredients Tab Component - Enhanced with JSON upload
const IngredientsTab = ({ ingredients, setIngredients }) => {
  const [showForm, setShowForm] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    portion: 100,
    unit: 'g',
    protein: 0,
    carbs: 0,
    fats: 0
  });

  // Calculate calories whenever macros change
  const calculatedCalories = calculateCalories(
    newIngredient.protein,
    newIngredient.carbs,
    newIngredient.fats
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newIngredient.name) {
      setIngredients([...ingredients, { 
        ...newIngredient, 
        id: Date.now(),
        calories: calculatedCalories
      }]);
      setNewIngredient({
        name: '',
        portion: 100,
        unit: 'g',
        protein: 0,
        carbs: 0,
        fats: 0
      });
      setShowForm(false);
    }
  };

  const deleteIngredient = (id) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  // Handle JSON file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target.result);
          if (Array.isArray(jsonData)) {
            const importedIngredients = jsonData.map((item, index) => ({
              ...item,
              id: Date.now() + index,
              calories: item.calories || calculateCalories(
                item.protein || 0,
                item.carbs || 0,
                item.fats || 0
              )
            }));
            setIngredients([...ingredients, ...importedIngredients]);
            alert(`Successfully imported ${importedIngredients.length} ingredients!`);
          } else {
            alert('Invalid JSON format. Please provide an array of ingredients.');
          }
        } catch (error) {
          alert('Error parsing JSON file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a JSON file.');
    }
  };

  // Export ingredients to JSON
  const exportIngredients = () => {
    const dataStr = JSON.stringify(ingredients, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'ingredients.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="tab-content">
      <div className="header-actions">
        <h2>Ingredients</h2>
        <div className="action-buttons">
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="json-upload"
          />
          <label htmlFor="json-upload" className="btn-secondary">
            📁 Import JSON
          </label>
          <button className="btn-secondary" onClick={exportIngredients}>
            💾 Export JSON
          </button>
          <button 
            className="btn-primary" 
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ Add Ingredient'}
          </button>
        </div>
      </div>

      {showForm && (
        <form className="ingredient-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              placeholder="Ingredient name"
              value={newIngredient.name}
              onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})}
              required
            />
            <input
              type="number"
              placeholder="Portion"
              value={newIngredient.portion}
              onChange={(e) => setNewIngredient({...newIngredient, portion: Number(e.target.value)})}
              required
            />
            <select 
              value={newIngredient.unit}
              onChange={(e) => setNewIngredient({...newIngredient, unit: e.target.value})}
            >
              <option value="g">g</option>
              <option value="ml">ml</option>
              <option value="unit">unit</option>
            </select>
          </div>
          
          <div className="form-row">
            <div className="macro-input">
              <label>Protein (g)</label>
              <input
                type="number"
                step="0.1"
                value={newIngredient.protein}
                onChange={(e) => setNewIngredient({...newIngredient, protein: Number(e.target.value)})}
              />
            </div>
            <div className="macro-input">
              <label>Carbs (g)</label>
              <input
                type="number"
                step="0.1"
                value={newIngredient.carbs}
                onChange={(e) => setNewIngredient({...newIngredient, carbs: Number(e.target.value)})}
              />
            </div>
            <div className="macro-input">
              <label>Fats (g)</label>
              <input
                type="number"
                step="0.1"
                value={newIngredient.fats}
                onChange={(e) => setNewIngredient({...newIngredient, fats: Number(e.target.value)})}
              />
            </div>
            <div className="macro-input">
              <label>Calories (auto)</label>
              <input
                type="number"
                value={calculatedCalories}
                disabled
                className="calculated-field"
              />
            </div>
          </div>
          
          <div className="calorie-info">
            <small>
              💡 Calories are automatically calculated: 
              Protein (4 cal/g) + Carbs (4 cal/g) + Fats (9 cal/g)
            </small>
          </div>
          
          <button type="submit" className="btn-submit">Add Ingredient</button>
        </form>
      )}

      <div className="ingredients-grid">
        {ingredients.map(ingredient => (
          <div key={ingredient.id} className="ingredient-card">
            <div className="card-header">
              <h3>{ingredient.name}</h3>
              <button 
                className="btn-delete" 
                onClick={() => deleteIngredient(ingredient.id)}
              >
                ×
              </button>
            </div>
            <p className="portion-info">Per {ingredient.portion}{ingredient.unit}</p>
            <div className="macro-display">
              <div className="macro-item protein">
                <span className="macro-value">{ingredient.protein}g</span>
                <span className="macro-label">Protein</span>
              </div>
              <div className="macro-item carbs">
                <span className="macro-value">{ingredient.carbs}g</span>
                <span className="macro-label">Carbs</span>
              </div>
              <div className="macro-item fats">
                <span className="macro-value">{ingredient.fats}g</span>
                <span className="macro-label">Fats</span>
              </div>
              <div className="macro-item calories">
                <span className="macro-value">{ingredient.calories}</span>
                <span className="macro-label">Calories</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="info-box">
        <p><strong>JSON Format Example:</strong></p>
        <pre>{`
        [
          {
            "name": "Chicken Breast",
            "portion": 100,
            "unit": "g",
            "protein": 31,
            "carbs": 0,
            "fats": 3.6
          },
          {
            "name": "Brown Rice",
            "portion": 100,
            "unit": "g",
            "protein": 2.6,
            "carbs": 23,
            "fats": 0.9
          }
        ]
      `}</pre>
      </div>
    </div>
  );
};

// Recipes Tab Component - Enhanced with total volume
const RecipesTab = ({ recipes, setRecipes, ingredients }) => {
  const [showForm, setShowForm] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    totalVolume: 1,
    volumeUnit: 'portion',
    ingredients: []
  });

  const addIngredientToRecipe = () => {
    setNewRecipe({
      ...newRecipe,
      ingredients: [...newRecipe.ingredients, { ingredientId: '', quantity: 0 }]
    });
  };

  const updateRecipeIngredient = (index, field, value) => {
    const updatedIngredients = [...newRecipe.ingredients];
    updatedIngredients[index][field] = field === 'quantity' ? Number(value) : value;
    setNewRecipe({ ...newRecipe, ingredients: updatedIngredients });
  };

  const removeRecipeIngredient = (index) => {
    setNewRecipe({
      ...newRecipe,
      ingredients: newRecipe.ingredients.filter((_, i) => i !== index)
    });
  };

  const calculateRecipeMacros = (recipeIngredients) => {
    let totalProtein = 0, totalCarbs = 0, totalFats = 0;

    recipeIngredients.forEach(item => {
      const ingredient = ingredients.find(ing => ing.id === Number(item.ingredientId));
      if (ingredient) {
        const ratio = item.quantity / ingredient.portion;
        totalProtein += ingredient.protein * ratio;
        totalCarbs += ingredient.carbs * ratio;
        totalFats += ingredient.fats * ratio;
      }
    });

    const totalCalories = calculateCalories(totalProtein, totalCarbs, totalFats);

    return {
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fats: Math.round(totalFats * 10) / 10,
      calories: totalCalories
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newRecipe.name && newRecipe.ingredients.length > 0) {
      const totalMacros = calculateRecipeMacros(newRecipe.ingredients);
      
      // Calculate macros per unit volume
      const macrosPerUnit = {
        protein: totalMacros.protein / newRecipe.totalVolume,
        carbs: totalMacros.carbs / newRecipe.totalVolume,
        fats: totalMacros.fats / newRecipe.totalVolume,
        calories: totalMacros.calories / newRecipe.totalVolume
      };

      setRecipes([...recipes, { 
        ...newRecipe, 
        id: Date.now(),
        totalMacros,
        macrosPerUnit
      }]);
      setNewRecipe({ name: '', totalVolume: 1, volumeUnit: 'portion', ingredients: [] });
      setShowForm(false);
    }
  };

  const deleteRecipe = (id) => {
    setRecipes(recipes.filter(recipe => recipe.id !== id));
  };

  return (
    <div className="tab-content">
      <div className="header-actions">
        <h2>Recipes</h2>
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Create Recipe'}
        </button>
      </div>

      {showForm && (
        <form className="recipe-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              placeholder="Recipe name"
              value={newRecipe.name}
              onChange={(e) => setNewRecipe({...newRecipe, name: e.target.value})}
              required
              style={{ flex: 2 }}
            />
            <input
              type="number"
              placeholder="Total volume"
              value={newRecipe.totalVolume}
              onChange={(e) => setNewRecipe({...newRecipe, totalVolume: Number(e.target.value)})}
              min="0.1"
              step="0.1"
              required
            />
            <select
              value={newRecipe.volumeUnit}
              onChange={(e) => setNewRecipe({...newRecipe, volumeUnit: e.target.value})}
            >
              <option value="portion">portion(s)</option>
              <option value="g">g</option>
              <option value="ml">ml</option>
            </select>
          </div>

          <div className="recipe-ingredients">
            <h4>Ingredients</h4>
            {newRecipe.ingredients.map((item, index) => (
              <div key={index} className="recipe-ingredient-row">
                <select
                  value={item.ingredientId}
                  onChange={(e) => updateRecipeIngredient(index, 'ingredientId', e.target.value)}
                  required
                >
                  <option value="">Select ingredient</option>
                  {ingredients.map(ing => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) => updateRecipeIngredient(index, 'quantity', e.target.value)}
                  required
                />
                <span className="unit-label">
                  {item.ingredientId && 
                    ingredients.find(ing => ing.id === Number(item.ingredientId))?.unit
                  }
                </span>
                <button 
                  type="button" 
                  className="btn-remove"
                  onClick={() => removeRecipeIngredient(index)}
                >
                  Remove
                </button>
              </div>
            ))}
            <button 
              type="button" 
              className="btn-add-ingredient"
              onClick={addIngredientToRecipe}
            >
              + Add Ingredient
            </button>
          </div>

          {newRecipe.ingredients.length > 0 && (
            <div className="recipe-preview">
              <h4>Recipe Total Macros</h4>
              <MacroDisplay macros={calculateRecipeMacros(newRecipe.ingredients)} />
              <p className="recipe-info">
                This will create {newRecipe.totalVolume} {newRecipe.volumeUnit}
              </p>
            </div>
          )}

          <button type="submit" className="btn-submit">Create Recipe</button>
        </form>
      )}

      <div className="recipes-grid">
        {recipes.map(recipe => (
          <div key={recipe.id} className="recipe-card">
            <div className="card-header">
              <h3>{recipe.name}</h3>
              <button 
                className="btn-delete" 
                onClick={() => deleteRecipe(recipe.id)}
              >
                ×
              </button>
            </div>
            
            <p className="recipe-volume">
              Makes: {recipe.totalVolume} {recipe.volumeUnit}
            </p>
            
            <div className="recipe-ingredients-list">
              <h4>Ingredients:</h4>
              {recipe.ingredients.map((item, index) => {
                const ingredient = ingredients.find(ing => ing.id === Number(item.ingredientId));
                return ingredient ? (
                  <p key={index}>
                    • {ingredient.name}: {item.quantity}{ingredient.unit}
                  </p>
                ) : null;
              })}
            </div>

            <h4>Per {recipe.volumeUnit === 'portion' ? 'portion' : recipe.volumeUnit}:</h4>
            <MacroDisplay macros={recipe.macrosPerUnit} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Diet Tab Component - Enhanced with meals and recipe customization
const DietTab = ({ meals, setMeals, recipes, ingredients }) => {
  const [selectedMeal, setSelectedMeal] = useState('Breakfast');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState('recipe'); // 'recipe' or 'ingredient'
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [editingItem, setEditingItem] = useState(null);

  const addToMeal = (e) => {
    e.preventDefault();
    if (selectedItem && quantity > 0) {
      let newItem;
      
      if (addType === 'recipe') {
        const recipe = recipes.find(r => r.id === Number(selectedItem));
        if (recipe) {
          newItem = {
            id: Date.now(),
            type: 'recipe',
            itemId: recipe.id,
            name: recipe.name,
            quantity: quantity,
            unit: recipe.volumeUnit,
            customIngredients: null, // Will store custom proportions if edited
            originalRecipe: recipe
          };
        }
      } else {
        const ingredient = ingredients.find(i => i.id === Number(selectedItem));
        if (ingredient) {
          newItem = {
            id: Date.now(),
            type: 'ingredient',
            itemId: ingredient.id,
            name: ingredient.name,
            quantity: quantity,
            unit: ingredient.unit,
            originalIngredient: ingredient
          };
        }
      }

      if (newItem) {
        setMeals({
          ...meals,
          [selectedMeal]: [...meals[selectedMeal], newItem]
        });
        setSelectedItem('');
        setQuantity(1);
        setShowAddForm(false);
      }
    }
  };

  const removeFromMeal = (meal, itemId) => {
    setMeals({
      ...meals,
      [meal]: meals[meal].filter(item => item.id !== itemId)
    });
  };

  const updateItemQuantity = (meal, itemId, newQuantity) => {
    setMeals({
      ...meals,
      [meal]: meals[meal].map(item => 
        item.id === itemId ? { ...item, quantity: Number(newQuantity) } : item
      )
    });
  };

  const calculateItemMacros = (item) => {
    if (item.type === 'recipe') {
      const recipe = item.customIngredients ? 
        { ...item.originalRecipe, ingredients: item.customIngredients } : 
        item.originalRecipe;
      
      let totalProtein = 0, totalCarbs = 0, totalFats = 0;
      
      recipe.ingredients.forEach(ing => {
        const ingredient = ingredients.find(i => i.id === Number(ing.ingredientId));
        if (ingredient) {
          const ratio = ing.quantity / ingredient.portion;
          totalProtein += ingredient.protein * ratio;
          totalCarbs += ingredient.carbs * ratio;
          totalFats += ingredient.fats * ratio;
        }
      });

      // Scale by quantity and recipe volume
      const scale = item.quantity / recipe.totalVolume;
      return {
        protein: Math.round(totalProtein * scale * 10) / 10,
        carbs: Math.round(totalCarbs * scale * 10) / 10,
        fats: Math.round(totalFats * scale * 10) / 10,
        calories: Math.round(calculateCalories(totalProtein * scale, totalCarbs * scale, totalFats * scale))
      };
    } else {
      const ingredient = item.originalIngredient;
      const ratio = item.quantity / ingredient.portion;
      return {
        protein: Math.round(ingredient.protein * ratio * 10) / 10,
        carbs: Math.round(ingredient.carbs * ratio * 10) / 10,
        fats: Math.round(ingredient.fats * ratio * 10) / 10,
        calories: Math.round(ingredient.calories * ratio)
      };
    }
  };

  const getMealTotals = (mealType) => {
    return meals[mealType].reduce((total, item) => {
      const itemMacros = calculateItemMacros(item);
      return {
        protein: total.protein + itemMacros.protein,
        carbs: total.carbs + itemMacros.carbs,
        fats: total.fats + itemMacros.fats,
        calories: total.calories + itemMacros.calories
      };
    }, { protein: 0, carbs: 0, fats: 0, calories: 0 });
  };

  const getDayTotals = () => {
    return MEAL_TYPES.reduce((total, mealType) => {
      const mealTotals = getMealTotals(mealType);
      return {
        protein: total.protein + mealTotals.protein,
        carbs: total.carbs + mealTotals.carbs,
        fats: total.fats + mealTotals.fats,
        calories: total.calories + mealTotals.calories
      };
    }, { protein: 0, carbs: 0, fats: 0, calories: 0 });
  };

  const customizeRecipe = (meal, itemId) => {
    const item = meals[meal].find(i => i.id === itemId);
    if (item && item.type === 'recipe') {
      setEditingItem({ meal, item });
    }
  };

  return (
    <div className="tab-content">
      <div className="header-actions">
        <h2>My Diet Plan</h2>
        <button 
          className="btn-primary" 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add to Meal'}
        </button>
      </div>

      {showAddForm && (
        <form className="diet-add-form" onSubmit={addToMeal}>
          <select
            value={selectedMeal}
            onChange={(e) => setSelectedMeal(e.target.value)}
          >
            {MEAL_TYPES.map(meal => (
              <option key={meal} value={meal}>{meal}</option>
            ))}
          </select>

          <select
            value={addType}
            onChange={(e) => {
              setAddType(e.target.value);
              setSelectedItem('');
            }}
          >
            <option value="recipe">Recipe</option>
            <option value="ingredient">Ingredient</option>
          </select>

          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            required
          >
            <option value="">Select {addType}</option>
            {addType === 'recipe' ? 
              recipes.map(recipe => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.name} ({recipe.totalVolume} {recipe.volumeUnit})
                </option>
              )) :
              ingredients.map(ingredient => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.name}
                </option>
              ))
            }
          </select>
          
          <input
            type="number"
            min="0.1"
            step="0.1"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
          />
          
          <button type="submit" className="btn-primary">
            Add to {selectedMeal}
          </button>
        </form>
      )}

      <div className="meals-container">
        {MEAL_TYPES.map(mealType => {
          const mealTotals = getMealTotals(mealType);
          return (
            <div key={mealType} className="meal-section">
              <div className="meal-header">
                <h3>{mealType}</h3>
                <div className="meal-totals">
                  <span className="macro-badge protein">{mealTotals.protein}g P</span>
                  <span className="macro-badge carbs">{mealTotals.carbs}g C</span>
                  <span className="macro-badge fats">{mealTotals.fats}g F</span>
                  <span className="macro-badge calories">{mealTotals.calories} cal</span>
                </div>
              </div>

              <div className="meal-items">
                {meals[mealType].map(item => {
                  const itemMacros = calculateItemMacros(item);
                  return (
                    <div key={item.id} className="meal-item">
                      <div className="meal-item-header">
                        <h4>
                          {item.name} 
                          {item.customIngredients && <span className="custom-badge">customized</span>}
                        </h4>
                        <div className="meal-item-controls">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(mealType, item.id, e.target.value)}
                            min="0.1"
                            step="0.1"
                            className="quantity-input"
                          />
                          <span className="unit-label">{item.unit}</span>
                          {item.type === 'recipe' && (
                            <button 
                              className="btn-customize"
                              onClick={() => customizeRecipe(mealType, item.id)}
                              title="Customize recipe proportions"
                            >
                              ⚙️
                            </button>
                          )}
                          <button 
                            className="btn-delete"
                            onClick={() => removeFromMeal(mealType, item.id)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <div className="meal-item-macros">
                        <span>{itemMacros.protein}g protein</span>
                        <span>{itemMacros.carbs}g carbs</span>
                        <span>{itemMacros.fats}g fats</span>
                        <span>{itemMacros.calories} cal</span>
                      </div>
                    </div>
                  );
                })}
                {meals[mealType].length === 0 && (
                  <p className="empty-meal">No items in this meal</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="diet-summary">
        <h3>Daily Total</h3>
        <MacroDisplay macros={getDayTotals()} isTotal={true} />
      </div>

      {editingItem && (
        <RecipeCustomizer
          item={editingItem.item}
          meal={editingItem.meal}
          ingredients={ingredients}
          onSave={(customizedIngredients) => {
            setMeals({
              ...meals,
              [editingItem.meal]: meals[editingItem.meal].map(i => 
                i.id === editingItem.item.id 
                  ? { ...i, customIngredients: customizedIngredients }
                  : i
              )
            });
            setEditingItem(null);
          }}
          onCancel={() => setEditingItem(null)}
        />
      )}
    </div>
  );
};

// Recipe Customizer Component
const RecipeCustomizer = ({ item, meal, ingredients, onSave, onCancel }) => {
  const [customIngredients, setCustomIngredients] = useState(
    item.customIngredients || item.originalRecipe.ingredients
  );

  const updateIngredientQuantity = (index, newQuantity) => {
    const updated = [...customIngredients];
    updated[index] = { ...updated[index], quantity: Number(newQuantity) };
    setCustomIngredients(updated);
  };

  const calculatePreview = () => {
    let totalProtein = 0, totalCarbs = 0, totalFats = 0;
    
    customIngredients.forEach(ing => {
      const ingredient = ingredients.find(i => i.id === Number(ing.ingredientId));
      if (ingredient) {
        const ratio = ing.quantity / ingredient.portion;
        totalProtein += ingredient.protein * ratio;
        totalCarbs += ingredient.carbs * ratio;
        totalFats += ingredient.fats * ratio;
      }
    });

    const scale = item.quantity / item.originalRecipe.totalVolume;
    return {
      protein: Math.round(totalProtein * scale * 10) / 10,
      carbs: Math.round(totalCarbs * scale * 10) / 10,
      fats: Math.round(totalFats * scale * 10) / 10,
      calories: Math.round(calculateCalories(totalProtein * scale, totalCarbs * scale, totalFats * scale))
    };
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content recipe-customizer">
        <h3>Customize Recipe: {item.name}</h3>
        <p className="customize-info">
          Adjust ingredient quantities for this meal only. The original recipe won't be changed.
        </p>
        
        <div className="customizer-ingredients">
          <h4>Ingredients</h4>
          {customIngredients.map((ing, index) => {
            const ingredient = ingredients.find(i => i.id === Number(ing.ingredientId));
            return ingredient ? (
              <div key={index} className="customizer-row">
                <span className="ingredient-name">{ingredient.name}</span>
                <input
                  type="number"
                  value={ing.quantity}
                  onChange={(e) => updateIngredientQuantity(index, e.target.value)}
                  min="0"
                  step="0.1"
                />
                <span className="unit-label">{ingredient.unit}</span>
              </div>
            ) : null;
          })}
        </div>

        <div className="customizer-preview">
          <h4>Macros Preview (for {item.quantity} {item.unit})</h4>
          <MacroDisplay macros={calculatePreview()} />
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary" onClick={() => onSave(customIngredients)}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// MacroDisplay Component
const MacroDisplay = ({ macros, isTotal = false }) => {
  return (
    <div className={`macro-display ${isTotal ? 'total' : ''}`}>
      <div className="macro-item protein">
        <span className="macro-value">{Math.round(macros.protein * 10) / 10}g</span>
        <span className="macro-label">Protein</span>
      </div>
      <div className="macro-item carbs">
        <span className="macro-value">{Math.round(macros.carbs * 10) / 10}g</span>
        <span className="macro-label">Carbs</span>
      </div>
      <div className="macro-item fats">
        <span className="macro-value">{Math.round(macros.fats * 10) / 10}g</span>
        <span className="macro-label">Fats</span>
      </div>
      <div className="macro-item calories">
        <span className="macro-value">{Math.round(macros.calories)}</span>
        <span className="macro-label">Calories</span>
      </div>
    </div>
  );
};

export default App;