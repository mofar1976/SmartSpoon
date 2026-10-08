import { Schema, Type } from '@google/genai';

// Gemini's responseSchema uses its OpenAPI subset. The stricter Zod contract
// still validates numeric/array bounds, string lengths, IDs and unknown fields
// locally. Keep the remote schema structural for model compatibility.
export const geminiRecipeSchema: Schema = {
  type: Type.OBJECT,
  required: ['recipes'],
  properties: {
    recipes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['title', 'servings', 'cookingTimeMinutes', 'ingredients', 'steps'],
        properties: {
          title: { type: Type.STRING },
          servings: { type: Type.INTEGER },
          cookingTimeMinutes: { type: Type.INTEGER },
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT, required: ['productId', 'quantity', 'unit'],
              properties: {
                productId: { type: Type.STRING },
                quantity: { type: Type.INTEGER },
                unit: { type: Type.STRING, enum: ['g', 'ml', 'piece'] },
              },
            },
          },
          steps: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
  },
};
