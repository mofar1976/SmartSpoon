import { BadGatewayException, Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { RECIPE_PROVIDER, RecipeProvider, recipeBatchSchema } from '../ai/recipe-contract';
import { ProductsService } from '../products/products.service';
import { TEST_PRICE_NOTICE } from '../products/supermarkets';
import { GenerateRecipesDto } from './dto/generate-recipes.dto';
import { BudgetService, InvalidRecipeProposal } from './budget.service';
import { ageFromBirthDate } from './age';

@Injectable()
export class RecipesService {
  constructor(
    private readonly products: ProductsService,
    @Inject(RECIPE_PROVIDER) private readonly ai: RecipeProvider,
    private readonly budget: BudgetService,
  ) {}

  async generate(preferences: GenerateRecipesDto, birthDate: string | null) {
    const catalog = await this.products.forRecipes(preferences.supermarket);
    if (!catalog.length) throw new UnprocessableEntityException('Für diesen Supermarkt sind keine Produkte vorhanden. Bitte zuerst den Testkatalog laden.');
    const allowed = catalog.filter(product => product.ingredientKey && product.dietaryTags && product.allergens
      && product.dietaryTags.includes(preferences.diet)
      && !product.allergens.some(allergen => preferences.allergies.includes(allergen))
      && !preferences.excludedIngredients.includes(product.ingredientKey));
    if (!allowed.length) throw new UnprocessableEntityException('Keine passenden Produkte vorhanden. Vorgaben oder Katalog prüfen; ältere Testdaten gegebenenfalls erneut laden.');
    if (Math.min(...allowed.map(product => product.priceCents)) > preferences.weeklyBudgetCents) throw new UnprocessableEntityException('Das Budget reicht nicht für eine Packung eines passenden Produkts.');
    let correction: string | undefined;
    for (let attempt = 0; attempt < 2; attempt++) {
      const raw = await this.ai.generate({ preferences, age: ageFromBirthDate(birthDate), products: allowed, correction });
      const parsed = recipeBatchSchema.safeParse(raw);
      if (!parsed.success) throw new BadGatewayException('Ungültige strukturierte Rezeptantwort.');
      if (!parsed.data.recipes.length) throw new UnprocessableEntityException('Mit diesen Vorgaben konnte keine passende Rezeptauswahl erstellt werden.');
      try {
        return { ...this.budget.evaluate(parsed.data, allowed, preferences), priceType: 'test', priceNotice: TEST_PRICE_NOTICE };
      } catch (error) {
        if (!(error instanceof InvalidRecipeProposal)) throw error;
        correction = error.message;
      }
    }
    throw new UnprocessableEntityException('Die KI konnte nach einer Korrektur keine Rezeptauswahl liefern, die alle Vorgaben und das Budget einhält.');
  }
}
