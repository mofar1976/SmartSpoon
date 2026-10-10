import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { RecipeGenerationResponseDto } from '../../recipes/dto/recipe-response.dto';
import { PantryRecipesResponseDto } from '../../pantry-recipes/dto/pantry-recipes-response.dto';
import { SavableRecipeResponse } from '../snapshot-proof.service';

@ApiExtraModels(RecipeGenerationResponseDto, PantryRecipesResponseDto)
export class SaveRecipesDto {
  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(RecipeGenerationResponseDto) },
      { $ref: getSchemaPath(PantryRecipesResponseDto) },
    ],
    description:
      'Vollständige, unveränderte Antwort von /recipes/generate oder /pantry-recipes/generate einschließlich saveProof. Der signierte Nachweis schützt das Ergebnis vor Manipulation.',
  })
  @IsObject()
  result!: SavableRecipeResponse;

  @ApiPropertyOptional({
    maxLength: 120,
    description: 'Optionaler Name; Standard ist der Titel des ersten Rezepts.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({
    type: [String],
    default: [],
    description: 'Bereits abgehakte Produkt-IDs aus dieser Einkaufsliste.',
  })
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @Matches(/^[a-f\d]{24}$/i, { each: true })
  checkedProductIds: string[] = [];

  @ApiPropertyOptional({
    type: [String],
    default: [],
    description:
      'Nur für Vorratsrezepte: abgehakte IDs aus recipes[].shoppingList[].id. Für Supermarktrezepte checkedProductIds verwenden.',
  })
  @IsArray()
  @ArrayMaxSize(280)
  @ArrayUnique()
  @Matches(/^recipe-[1-7]-item-(?:[1-9]|[1-3]\d|40)$/, { each: true })
  checkedItemIds: string[] = [];
}
