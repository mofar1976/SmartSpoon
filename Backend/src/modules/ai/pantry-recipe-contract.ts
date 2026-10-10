import { z } from 'zod';
import type { GeneratePantryRecipesDto } from '../pantry-recipes/dto/generate-pantry-recipes.dto';

export const pantryRecipeBatchSchema = z
  .object({
    recipes: z
      .array(
        z
          .object({
            title: z.string().trim().min(1).max(120),
            servings: z.number().int().min(1).max(10),
            cookingTimeMinutes: z.number().int().min(1).max(180),
            ingredients: z
              .array(
                z
                  .object({
                    ingredientId: z
                      .string()
                      .regex(/^ingredient-\d+$/)
                      .nullable(),
                    name: z.string().trim().min(1).max(80),
                    quantity: z.number().int().min(1).max(100000),
                    unit: z.enum(['g', 'ml', 'piece']),
                  })
                  .strict(),
              )
              .min(1)
              .max(40),
            steps: z.array(z.string().trim().min(1).max(500)).min(1).max(15),
          })
          .strict(),
      )
      .max(7),
  })
  .strict();
export type PantryRecipeBatch = z.infer<typeof pantryRecipeBatchSchema>;
export interface PantryRecipeContext {
  preferences: Omit<GeneratePantryRecipesDto, 'ingredients'>;
  ingredients: { id: string; name: string; quantity?: number; unit?: string }[];
  age: number | null;
  correction?: string;
}
export interface PantryRecipeProvider {
  generate(context: PantryRecipeContext): Promise<PantryRecipeBatch>;
}
export const PANTRY_RECIPE_PROVIDER = Symbol('PANTRY_RECIPE_PROVIDER');
