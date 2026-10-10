import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  PANTRY_RECIPE_PROVIDER,
  PantryRecipeProvider,
  PantryRecipeBatch,
  pantryRecipeBatchSchema,
} from '../ai/pantry-recipe-contract';
import { SnapshotProofService } from '../saved-recipes/snapshot-proof.service';
import { ageFromBirthDate } from '../recipes/age';
import { GeneratePantryRecipesDto } from './dto/generate-pantry-recipes.dto';

const normalized = (name: string) =>
  name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('de-DE');
class InvalidPantryProposal extends Error {}
export const PANTRY_NOTICE =
  'Rezeptalternativen einzeln planen. Bei fehlenden Vorratsmengen benötigte Mengen prüfen. Zutaten, Produktetiketten und Allergene vor dem Kochen prüfen; Erkennung und KI ersetzen diese Prüfung nicht.';

@Injectable()
export class PantryRecipesService {
  constructor(
    @Inject(PANTRY_RECIPE_PROVIDER) private readonly ai: PantryRecipeProvider,
    private readonly proofs: SnapshotProofService,
  ) {}

  async generate(request: GeneratePantryRecipesDto, birthDate: string | null, ownerId: string) {
    if (request.ingredientsConfirmed !== true)
      throw new BadRequestException('Zutaten zuerst bestätigen.');
    const names = request.ingredients.map((item) => normalized(item.name));
    if (new Set(names).size !== names.length)
      throw new BadRequestException('Doppelte Zutaten zusammenfassen.');
    const { ingredients: supplied, ...preferences } = request;
    const ingredients = supplied.map((item, index) => ({ id: `ingredient-${index + 1}`, ...item }));
    let correction: string | undefined;
    for (let attempt = 0; attempt < 2; attempt++) {
      const raw = await this.ai.generate({
        preferences,
        ingredients,
        age: ageFromBirthDate(birthDate),
        correction,
      });
      const parsed = pantryRecipeBatchSchema.safeParse(raw);
      if (!parsed.success)
        throw new BadGatewayException('Ungültige strukturierte Vorratsrezeptantwort.');
      try {
        if (!parsed.data.recipes.length)
          throw new InvalidPantryProposal(
            'Die Antwort war leer. Prüfe erneut einfache Salate, gedämpftes Gemüse oder andere einfache Zubereitungen mit Teilmengen der bestätigten Zutaten. Fehlende Vorratsmengen sind kein Ablehnungsgrund. Alle Nutzervorgaben bleiben verbindlich; keine zusätzlichen Zutaten ohne Erlaubnis verwenden. Wenn tatsächlich keine passenden Alternativen möglich sind, recipes=[] liefern.',
          );
        const recipes = this.evaluate(parsed.data, request, ingredients);
        const snapshot = {
          mode: 'pantry' as const,
          requiresIngredientReview: true as const,
          notice: PANTRY_NOTICE,
          recipes,
        };
        return { ...snapshot, saveProof: await this.proofs.issue(snapshot, ownerId) };
      } catch (error) {
        if (!(error instanceof InvalidPantryProposal)) throw error;
        correction = error.message;
      }
    }
    throw new UnprocessableEntityException(
      'Die KI konnte auch nach einer Korrektur keine Rezepte innerhalb der Vorgaben erstellen.',
    );
  }

  private evaluate(
    batch: PantryRecipeBatch,
    request: GeneratePantryRecipesDto,
    available: { id: string; name: string; quantity?: number; unit?: string }[],
  ) {
    if (batch.recipes.length !== request.recipeCount)
      throw new InvalidPantryProposal('Exakt die angefragte Rezeptanzahl liefern.');
    const byId = new Map(available.map((item) => [item.id, item]));
    const byName = new Map(available.map((item) => [normalized(item.name), item]));
    const excluded = new Set(request.excludedIngredients.map(normalized));
    return batch.recipes.map((recipe, recipeIndex) => {
      if (
        recipe.servings !== request.persons ||
        recipe.cookingTimeMinutes > request.maxCookingTimeMinutes
      )
        throw new InvalidPantryProposal('Personenanzahl und maximale Kochzeit einhalten.');
      const used = new Set<string>();
      let availableUsed = false;
      const ingredients = recipe.ingredients.map((item) => {
        const source = item.ingredientId ? byId.get(item.ingredientId) : undefined;
        if (item.ingredientId && !source)
          throw new InvalidPantryProposal('Nur bekannte Vorrats-IDs verwenden.');
        if (!source && (!request.allowAdditionalIngredients || byName.has(normalized(item.name))))
          throw new InvalidPantryProposal(
            'Zusätzliche Zutaten nicht erlaubt oder vorhandene Zutat fälschlich als Zusatz bezeichnet.',
          );
        const name = source?.name ?? item.name;
        const key = normalized(name);
        if (used.has(key) || excluded.has(key))
          throw new InvalidPantryProposal('Doppelte und ausgeschlossene Zutaten nicht verwenden.');
        used.add(key);
        if (source) {
          availableUsed = true;
          if (source.unit && source.unit !== item.unit)
            throw new InvalidPantryProposal('Die vorgegebene Einheit verwenden.');
          if (source.quantity !== undefined && item.quantity > source.quantity)
            throw new InvalidPantryProposal('Verfügbare Menge je Rezept nicht überschreiten.');
        }
        return { ...item, name, source: source ? ('available' as const) : ('additional' as const) };
      });
      if (!availableUsed)
        throw new InvalidPantryProposal(
          'Mindestens eine bestätigte Vorratszutat je Rezept verwenden.',
        );
      const shoppingList = ingredients
        .filter((item) => item.source === 'additional')
        .map(({ name, quantity, unit }, itemIndex) => ({
          id: `recipe-${recipeIndex + 1}-item-${itemIndex + 1}`,
          name,
          quantity,
          unit,
        }));
      return { ...recipe, ingredients, shoppingList };
    });
  }
}
