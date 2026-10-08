import { Injectable } from '@nestjs/common';
import { RecipeBatch } from '../ai/recipe-contract';
import { ProductResponseDto } from '../products/dto/product-response.dto';
import { GenerateRecipesDto } from './dto/generate-recipes.dto';

export class InvalidRecipeProposal extends Error {}

@Injectable()
export class BudgetService {
  evaluate(batch: RecipeBatch, products: ProductResponseDto[], preferences: GenerateRecipesDto) {
    if (batch.recipes.length !== preferences.recipeCount) throw new InvalidRecipeProposal('Die Anzahl der Rezepte stimmt nicht.');
    const catalog = new Map(products.map(product => [product.id, product]));
    const totals = new Map<string, number>();
    for (const recipe of batch.recipes) {
      if (recipe.servings !== preferences.persons || recipe.cookingTimeMinutes > preferences.maxCookingTimeMinutes) throw new InvalidRecipeProposal('Personenanzahl oder Kochzeit wurde nicht eingehalten.');
      const seen = new Set<string>();
      for (const ingredient of recipe.ingredients) {
        const product = catalog.get(ingredient.productId);
        if (!product || product.packageUnit !== ingredient.unit) throw new InvalidRecipeProposal('Eine Zutat ist nicht erlaubt oder ihre Einheit stimmt nicht.');
        if (seen.has(product.id)) throw new InvalidRecipeProposal('Zutaten dürfen innerhalb eines Rezepts nicht doppelt aufgeführt werden.');
        seen.add(product.id);
        totals.set(product.id, (totals.get(product.id) ?? 0) + ingredient.quantity);
      }
    }
    const shoppingList = [...totals].map(([id, quantity]) => {
      const product = catalog.get(id)!;
      if (!Number.isSafeInteger(product.priceCents) || product.priceCents < 1 || !Number.isSafeInteger(product.packageQuantity) || product.packageQuantity < 1) throw new InvalidRecipeProposal('Ungültige Produktpreise oder Packungsmengen.');
      const packs = Math.ceil(quantity / product.packageQuantity);
      const costCents = packs * product.priceCents;
      if (!Number.isSafeInteger(costCents)) throw new InvalidRecipeProposal('Einkaufskosten sind zu groß.');
      return { product, neededQuantity: quantity, packs, purchasedQuantity: packs * product.packageQuantity, leftoverQuantity: packs * product.packageQuantity - quantity, costCents };
    });
    const totalCostCents = shoppingList.reduce((sum, item) => sum + item.costCents, 0);
    if (!Number.isSafeInteger(totalCostCents) || totalCostCents > preferences.weeklyBudgetCents) throw new InvalidRecipeProposal('Die Kosten aller benötigten ganzen Packungen überschreiten das Wochenbudget.');
    const recipes = batch.recipes.map(recipe => ({
      ...recipe,
      ingredients: recipe.ingredients.map(ingredient => ({ ...ingredient, productName: catalog.get(ingredient.productId)!.name })),
    }));
    return { recipes, shoppingList, totalCostCents, remainingBudgetCents: preferences.weeklyBudgetCents - totalCostCents, currency: 'EUR' };
  }
}
