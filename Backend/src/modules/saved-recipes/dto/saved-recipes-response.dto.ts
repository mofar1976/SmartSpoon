import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
  OmitType,
} from '@nestjs/swagger';
import { PantryRecipesResponseDto } from '../../pantry-recipes/dto/pantry-recipes-response.dto';
import { RecipeSnapshot } from '../snapshot-proof.service';
import { RecipeGenerationResponseDto } from '../../recipes/dto/recipe-response.dto';
export class SavedRecipeSnapshotDto extends OmitType(RecipeGenerationResponseDto, [
  'saveProof',
] as const) {}
export class SavedPantryRecipeSnapshotDto extends OmitType(PantryRecipesResponseDto, [
  'saveProof',
] as const) {}
@ApiExtraModels(SavedRecipeSnapshotDto, SavedPantryRecipeSnapshotDto)
export class SavedRecipeResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ format: 'date-time' }) generatedAt!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ enum: ['market', 'pantry'] }) mode!: 'market' | 'pantry';
  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(SavedRecipeSnapshotDto) },
      { $ref: getSchemaPath(SavedPantryRecipeSnapshotDto) },
    ],
  })
  result!: RecipeSnapshot;
  @ApiProperty({ type: [String] }) checkedProductIds!: string[];
  @ApiProperty({ type: [String] }) checkedItemIds!: string[];
}
export class SavedRecipeSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ format: 'date-time' }) generatedAt!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ enum: ['market', 'pantry'] }) mode!: 'market' | 'pantry';
  @ApiPropertyOptional({ description: 'Nur für Supermarktrezepte vorhanden.' })
  totalCostCents?: number;
  @ApiPropertyOptional() currency?: string;
  @ApiPropertyOptional() priceType?: string;
  @ApiProperty({ type: [String] }) recipeTitles!: string[];
}
export class SavedRecipeListDto {
  @ApiProperty({ type: [SavedRecipeSummaryDto] }) items!: SavedRecipeSummaryDto[];
  @ApiProperty() total!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() offset!: number;
}
