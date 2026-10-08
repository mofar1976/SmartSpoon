import { ApiProperty, OmitType } from '@nestjs/swagger';
import { RecipeGenerationResponseDto } from '../../recipes/dto/recipe-response.dto';
export class SavedRecipeSnapshotDto extends OmitType(RecipeGenerationResponseDto, [
  'saveProof',
] as const) {}
export class SavedRecipeResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ format: 'date-time' }) generatedAt!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ type: SavedRecipeSnapshotDto }) result!: SavedRecipeSnapshotDto;
  @ApiProperty({ type: [String] }) checkedProductIds!: string[];
}
export class SavedRecipeSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ format: 'date-time' }) generatedAt!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty() totalCostCents!: number;
  @ApiProperty() currency!: string;
  @ApiProperty() priceType!: string;
  @ApiProperty({ type: [String] }) recipeTitles!: string[];
}
export class SavedRecipeListDto {
  @ApiProperty({ type: [SavedRecipeSummaryDto] }) items!: SavedRecipeSummaryDto[];
  @ApiProperty() total!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() offset!: number;
}
