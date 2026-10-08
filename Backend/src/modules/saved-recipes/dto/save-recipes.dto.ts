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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecipeGenerationResponseDto } from '../../recipes/dto/recipe-response.dto';

export class SaveRecipesDto {
  @ApiProperty({
    type: RecipeGenerationResponseDto,
    description:
      'Vollständige, unveränderte Antwort von /recipes/generate einschließlich saveProof. Der signierte Nachweis schützt das Ergebnis vor Manipulation.',
  })
  @IsObject()
  result!: RecipeGenerationResponseDto;

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
}
