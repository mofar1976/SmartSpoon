const { TEST_PRODUCTS } = require('../dist/modules/products/data/test-products');
const { GenerateRecipesDto } = require('../dist/modules/recipes/dto/generate-recipes.dto');
const products = TEST_PRODUCTS.filter(p => p.supermarket === 'rewe').map((p, i) => ({ ...p, id: (i + 1).toString(16).padStart(24, '0') }));
const preferences = () => Object.assign(new GenerateRecipesDto(), { supermarket: 'rewe', weeklyBudgetCents: 4000, persons: 2, lifeSituation: 'student', maxCookingTimeMinutes: 30, recipeCount: 1 });
const batch = (product = products[0], quantity = 400) => ({ recipes: [{ title: 'Reisgericht', servings: 2, cookingTimeMinutes: 20, ingredients: [{ productId: product.id, quantity, unit: product.packageUnit }], steps: ['Zutaten mit Wasser garen.'] }] });
module.exports = { products, preferences, batch };
