import { ApiProperty } from '@nestjs/swagger';
import { ProductResponseDto } from '../../products/dto/product-response.dto';
import { PackageUnit } from '../../products/schemas/product.schema';

export class RecipeIngredientResponseDto {
  @ApiProperty() productId!: string;
  @ApiProperty() productName!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty({ enum: PackageUnit }) unit!: string;
}
export class RecipeResponseDto {
  @ApiProperty() title!: string;
  @ApiProperty() servings!: number;
  @ApiProperty() cookingTimeMinutes!: number;
  @ApiProperty({ type: [RecipeIngredientResponseDto] }) ingredients!: RecipeIngredientResponseDto[];
  @ApiProperty({ type: [String] }) steps!: string[];
}
export class ShoppingItemResponseDto {
  @ApiProperty({ type: ProductResponseDto }) product!: ProductResponseDto;
  @ApiProperty() neededQuantity!: number;
  @ApiProperty() packs!: number;
  @ApiProperty() purchasedQuantity!: number;
  @ApiProperty() leftoverQuantity!: number;
  @ApiProperty() costCents!: number;
}
export class RecipeGenerationResponseDto {
  @ApiProperty({
    description:
      '24 Stunden gültiger, nutzergebundener Nachweis zum Speichern dieses unveränderten Ergebnisses. Kein Zugangstoken.',
  })
  saveProof!: string;
  @ApiProperty({ type: [RecipeResponseDto] }) recipes!: RecipeResponseDto[];
  @ApiProperty({ type: [ShoppingItemResponseDto] }) shoppingList!: ShoppingItemResponseDto[];
  @ApiProperty() totalCostCents!: number;
  @ApiProperty() remainingBudgetCents!: number;
  @ApiProperty({ example: 'EUR' }) currency!: string;
  @ApiProperty({ example: 'test' }) priceType!: string;
  @ApiProperty() priceNotice!: string;
}
