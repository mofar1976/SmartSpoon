import { ApiProperty } from '@nestjs/swagger';
import { Allergen, Diet, IngredientKey } from '../food-preferences';
import { PackageUnit } from '../schemas/product.schema';
import { Supermarket } from '../supermarkets';

export class ProductResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: 'test-rewe-rice' }) sku!: string;
  @ApiProperty({ example: 'Reis' }) name!: string;
  @ApiProperty({ enum: Supermarket }) supermarket!: Supermarket;
  @ApiProperty({ enum: IngredientKey, nullable: true }) ingredientKey!: IngredientKey | null;
  @ApiProperty({ enum: Diet, isArray: true, nullable: true }) dietaryTags!: Diet[] | null;
  @ApiProperty({ enum: Allergen, isArray: true, nullable: true }) allergens!: Allergen[] | null;
  @ApiProperty({ example: 1000, description: 'Menge pro gekaufter Packung.' }) packageQuantity!: number;
  @ApiProperty({ enum: PackageUnit }) packageUnit!: PackageUnit;
  @ApiProperty({ example: 249, description: 'Preis einer ganzen Packung in Cent; fiktiver Testwert.' }) priceCents!: number;
  @ApiProperty({ example: 'EUR' }) currency!: string;
  @ApiProperty({ enum: ['test'] }) priceType!: string;
  @ApiProperty() sourceLabel!: string;
  @ApiProperty({ type: String, nullable: true }) sourceUrl!: string | null;
  @ApiProperty({ type: String, nullable: true }) location!: string | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true, description: 'Bei Testdaten null, da keine reale Preiserhebung stattgefunden hat.' }) observedAt!: string | null;
}

export class ProductListResponseDto {
  @ApiProperty({ type: [ProductResponseDto] }) items!: ProductResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() offset!: number;
  @ApiProperty() priceNotice!: string;
}
