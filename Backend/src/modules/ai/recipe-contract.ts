import { z } from 'zod';
import type { GenerateRecipesDto } from '../recipes/dto/generate-recipes.dto';
import type { ProductResponseDto } from '../products/dto/product-response.dto';

export const recipeBatchSchema = z.object({
  recipes: z.array(z.object({
    title: z.string().min(1).max(120),
    servings: z.number().int().min(1).max(10),
    cookingTimeMinutes: z.number().int().min(1).max(180),
    ingredients: z.array(z.object({
      productId: z.string().regex(/^[a-f\d]{24}$/i),
      quantity: z.number().int().min(1).max(100000),
      unit: z.enum(['g', 'ml', 'piece']),
    }).strict()).min(1).max(20),
    steps: z.array(z.string().min(1).max(500)).min(1).max(15),
  }).strict()).max(7),
}).strict();

export type RecipeBatch = z.infer<typeof recipeBatchSchema>;
export interface RecipeGenerationContext {
  preferences: GenerateRecipesDto;
  age: number | null;
  products: ProductResponseDto[];
  correction?: string;
}
export interface RecipeProvider {
  generate(context: RecipeGenerationContext): Promise<RecipeBatch>;
}
export const RECIPE_PROVIDER = Symbol('RECIPE_PROVIDER');
