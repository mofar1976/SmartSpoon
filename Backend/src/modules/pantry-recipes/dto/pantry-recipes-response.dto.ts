import { ApiProperty } from '@nestjs/swagger';
import { PantryUnit } from './generate-pantry-recipes.dto';

export class PantryShoppingItemDto {
  @ApiProperty({ example: 'Haferflocken' }) name!: string;
  @ApiProperty({ example: 50, minimum: 1 }) quantity!: number;
  @ApiProperty({ enum: PantryUnit }) unit!: 'g' | 'ml' | 'piece';
}
export class PantryShoppingEntryDto extends PantryShoppingItemDto {
  @ApiProperty({
    example: 'recipe-1-item-1',
    description: 'Stabile Artikel-ID innerhalb dieser Generierung.',
  })
  id!: string;
}
export class PantryRecipeIngredientDto extends PantryShoppingItemDto {
  @ApiProperty({ type: String, nullable: true, example: 'ingredient-1' }) ingredientId!:
    string | null;
  @ApiProperty({ enum: ['available', 'additional'] }) source!: 'available' | 'additional';
}
export class PantryRecipeDto {
  @ApiProperty({ example: 'Bananenreis' }) title!: string;
  @ApiProperty({ example: 2 }) servings!: number;
  @ApiProperty({ example: 20 }) cookingTimeMinutes!: number;
  @ApiProperty({ type: [PantryRecipeIngredientDto] }) ingredients!: PantryRecipeIngredientDto[];
  @ApiProperty({ type: [String] }) steps!: string[];
  @ApiProperty({
    type: [PantryShoppingEntryDto],
    description: 'Nur zusätzliche Zutaten für dieses einzelne Rezept; keine Preise.',
  })
  shoppingList!: PantryShoppingEntryDto[];
}
export class PantryRecipesResponseDto {
  @ApiProperty({
    description:
      '24 Stunden gültiger, nutzergebundener Speichernachweis für dieses unveränderte Ergebnis. Kein Zugangstoken.',
  })
  saveProof!: string;
  @ApiProperty({ enum: ['pantry'] }) mode!: 'pantry';
  @ApiProperty({ enum: [true] }) requiresIngredientReview!: true;
  @ApiProperty() notice!: string;
  @ApiProperty({
    type: [PantryRecipeDto],
    description: 'Alternativen, die einzeln mit den angegebenen Vorräten gekocht werden können.',
  })
  recipes!: PantryRecipeDto[];
}
