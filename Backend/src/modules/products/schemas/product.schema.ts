import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Allergen, Diet, IngredientKey } from '../food-preferences';
import { Supermarket } from '../supermarkets';

export enum PackageUnit {
  GRAM = 'g',
  MILLILITER = 'ml',
  PIECE = 'piece',
}

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, unique: true })
  sku!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, enum: Object.values(Supermarket) })
  supermarket!: Supermarket;

  @Prop({ enum: Object.values(IngredientKey) })
  ingredientKey?: IngredientKey;

  @Prop({ type: [String], enum: Object.values(Diet), default: undefined })
  dietaryTags?: Diet[];

  @Prop({ type: [String], enum: Object.values(Allergen), default: undefined })
  allergens?: Allergen[];

  @Prop({ required: true, min: 1, validate: Number.isSafeInteger })
  packageQuantity!: number;

  @Prop({ required: true, enum: Object.values(PackageUnit) })
  packageUnit!: PackageUnit;

  @Prop({ required: true, min: 1, validate: Number.isSafeInteger })
  priceCents!: number;

  @Prop({ required: true, enum: ['EUR'], default: 'EUR' })
  currency!: string;

  @Prop({ required: true, enum: ['test'] })
  priceType!: 'test';

  @Prop({ required: true })
  sourceLabel!: string;

  @Prop({ type: String, default: null })
  sourceUrl!: string | null;

  @Prop({ type: String, default: null })
  location!: string | null;

  @Prop({ type: Date, default: null })
  observedAt!: Date | null;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ supermarket: 1, sku: 1 });
