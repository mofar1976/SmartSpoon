import { Type, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  Equals,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Allergen, Diet } from '../../products/food-preferences';

export enum PantryUnit {
  GRAMS = 'g',
  MILLILITERS = 'ml',
  PIECES = 'piece',
}
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class ConfirmedIngredientDto {
  @ApiProperty({ example: 'Banane', maxLength: 80 })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Matches(/^[^\x00-\x1f\x7f]+$/)
  name!: string;

  @ApiPropertyOptional({
    example: 3,
    minimum: 1,
    maximum: 100000,
    description: 'Optionale verfügbare Menge; quantity und unit immer gemeinsam angeben.',
  })
  @ValidateIf((o: ConfirmedIngredientDto) => o.quantity !== undefined || o.unit !== undefined)
  @IsInt()
  @Min(1)
  @Max(100000)
  quantity?: number;

  @ApiPropertyOptional({ enum: PantryUnit })
  @ValidateIf((o: ConfirmedIngredientDto) => o.quantity !== undefined || o.unit !== undefined)
  @IsEnum(PantryUnit)
  unit?: PantryUnit;
}

export class GeneratePantryRecipesDto {
  @ApiProperty({ enum: [true], description: 'Zutaten wurden vom Nutzer geprüft und bestätigt.' })
  @Equals(true)
  ingredientsConfirmed!: true;

  @ApiProperty({ type: [ConfirmedIngredientDto], minItems: 1, maxItems: 40 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => ConfirmedIngredientDto)
  ingredients!: ConfirmedIngredientDto[];

  @ApiProperty({ minimum: 1, maximum: 10, example: 2 })
  @IsInt()
  @Min(1)
  @Max(10)
  persons!: number;

  @ApiProperty({ minimum: 5, maximum: 180, example: 30 })
  @IsInt()
  @Min(5)
  @Max(180)
  maxCookingTimeMinutes!: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 7, default: 3 })
  @IsInt()
  @Min(1)
  @Max(7)
  recipeCount = 3;

  @ApiPropertyOptional({ enum: Diet, default: Diet.OMNIVORE })
  @IsEnum(Diet)
  diet = Diet.OMNIVORE;

  @ApiPropertyOptional({ enum: Allergen, isArray: true, default: [] })
  @IsArray()
  @ArrayMaxSize(14)
  @ArrayUnique()
  @IsEnum(Allergen, { each: true })
  allergies: Allergen[] = [];

  @ApiPropertyOptional({
    type: [String],
    default: [],
    description:
      'Freie Zutatennamen; genaue Namensübereinstimmungen werden zusätzlich im Backend ausgeschlossen.',
  })
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value) ? value.map((item) => trim({ value: item })) : value,
  )
  @IsArray()
  @ArrayMaxSize(40)
  @ArrayUnique()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(80, { each: true })
  excludedIngredients: string[] = [];

  @ApiPropertyOptional({
    default: false,
    description:
      'Zusätzliche Zutaten einschließlich Salz, Öl oder Gewürzen ausdrücklich erlauben. Wasser ist zulässig.',
  })
  @IsBoolean()
  allowAdditionalIngredients = false;
}
