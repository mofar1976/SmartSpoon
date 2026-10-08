import { Allergen, Diet, IngredientKey } from '../food-preferences';
import { Product, PackageUnit } from '../schemas/product.schema';
import { SUPERMARKETS, TEST_PRICE_NOTICE } from '../supermarkets';

// Entirely invented fixtures. These values are not actual retailer offers.
const staples: Array<{ code: string; name: string; quantity: number; unit: PackageUnit; prices: [number, number, number] }> = [
  { code: 'rice', name: 'Reis', quantity: 1000, unit: PackageUnit.GRAM, prices: [249, 199, 209] },
  { code: 'pasta', name: 'Nudeln', quantity: 500, unit: PackageUnit.GRAM, prices: [99, 89, 95] },
  { code: 'oats', name: 'Haferflocken', quantity: 500, unit: PackageUnit.GRAM, prices: [89, 79, 85] },
  { code: 'lentils', name: 'Rote Linsen (trocken)', quantity: 500, unit: PackageUnit.GRAM, prices: [179, 159, 169] },
  { code: 'tomatoes', name: 'Passierte Tomaten', quantity: 500, unit: PackageUnit.GRAM, prices: [99, 89, 95] },
  { code: 'potatoes', name: 'Kartoffeln', quantity: 2000, unit: PackageUnit.GRAM, prices: [299, 249, 269] },
  { code: 'carrots', name: 'Karotten', quantity: 1000, unit: PackageUnit.GRAM, prices: [129, 109, 119] },
  { code: 'onions', name: 'Zwiebeln', quantity: 1000, unit: PackageUnit.GRAM, prices: [149, 129, 139] },
  { code: 'milk', name: 'Milch', quantity: 1000, unit: PackageUnit.MILLILITER, prices: [115, 105, 109] },
  { code: 'eggs', name: 'Eier', quantity: 10, unit: PackageUnit.PIECE, prices: [279, 249, 259] },
  { code: 'oil', name: 'Rapsöl', quantity: 1000, unit: PackageUnit.MILLILITER, prices: [199, 179, 189] },
  { code: 'chicken', name: 'Hähnchenbrust', quantity: 400, unit: PackageUnit.GRAM, prices: [449, 399, 419] },
];

export const TEST_PRODUCTS: Product[] = SUPERMARKETS.flatMap((market, index) => staples.map(staple => ({
  sku: `test-${market.id}-${staple.code}`,
  name: staple.name,
  ingredientKey: staple.code as IngredientKey,
  dietaryTags: staple.code === 'chicken' ? [Diet.OMNIVORE] : ['milk', 'eggs'].includes(staple.code) ? [Diet.OMNIVORE, Diet.VEGETARIAN] : Object.values(Diet),
  allergens: ['pasta', 'oats'].includes(staple.code) ? [Allergen.GLUTEN] : staple.code === 'milk' ? [Allergen.MILK] : staple.code === 'eggs' ? [Allergen.EGGS] : [],
  supermarket: market.id,
  packageQuantity: staple.quantity,
  packageUnit: staple.unit,
  priceCents: staple.prices[index],
  currency: 'EUR',
  priceType: 'test' as const,
  sourceLabel: TEST_PRICE_NOTICE,
  sourceUrl: null,
  location: null,
  observedAt: null,
})));
