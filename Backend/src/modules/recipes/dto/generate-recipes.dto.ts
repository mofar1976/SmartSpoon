import { ArrayMaxSize, ArrayUnique, IsArray, IsEnum, IsInt, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Allergen, Diet, IngredientKey } from '../../products/food-preferences';
import { Supermarket } from '../../products/supermarkets';

export enum LifeSituation { STUDENT = 'student', EMPLOYEE = 'employee', SELF_EMPLOYED = 'self_employed', UNEMPLOYED = 'unemployed', RETIRED = 'retired', OTHER = 'other' }

export class GenerateRecipesDto {
  @ApiProperty({ enum: Supermarket })
  @IsEnum(Supermarket)
  supermarket!: Supermarket;

  @ApiProperty({ example: 4000, minimum: 1, maximum: 100000, description: 'Wochenbudget in Cent. Die gesamten gekauften Packungen für diese Rezeptauswahl müssen darunter liegen.' })
  @IsInt() @Min(1) @Max(100000)
  weeklyBudgetCents!: number;

  @ApiProperty({ example: 1, minimum: 1, maximum: 10 })
  @IsInt() @Min(1) @Max(10)
  persons!: number;

  @ApiProperty({ enum: LifeSituation })
  @IsEnum(LifeSituation)
  lifeSituation!: LifeSituation;

  @ApiPropertyOptional({ enum: Diet, default: Diet.OMNIVORE })
  @IsEnum(Diet)
  diet: Diet = Diet.OMNIVORE;

  @ApiPropertyOptional({ enum: Allergen, isArray: true, default: [] })
  @IsArray() @ArrayMaxSize(14) @ArrayUnique() @IsEnum(Allergen, { each: true })
  allergies: Allergen[] = [];

  @ApiPropertyOptional({ enum: IngredientKey, isArray: true, default: [], description: 'Ausgeschlossene Zutaten anhand der ingredientKey-Werte im Produktkatalog.' })
  @IsArray() @ArrayMaxSize(12) @ArrayUnique() @IsEnum(IngredientKey, { each: true })
  excludedIngredients: IngredientKey[] = [];

  @ApiProperty({ example: 30, minimum: 5, maximum: 180 })
  @IsInt() @Min(5) @Max(180)
  maxCookingTimeMinutes!: number;

  @ApiPropertyOptional({ default: 3, minimum: 1, maximum: 7 })
  @IsInt() @Min(1) @Max(7)
  recipeCount: number = 3;
}
