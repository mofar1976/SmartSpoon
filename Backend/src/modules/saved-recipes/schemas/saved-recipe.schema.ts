import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongoSchema, Types } from 'mongoose';
import { RecipeSnapshot } from '../snapshot-proof.service';

@Schema({ timestamps: true, collection: 'saved_recipes' })
export class SavedRecipe {
  @Prop({ type: MongoSchema.Types.ObjectId, required: true, immutable: true })
  ownerId!: Types.ObjectId;
  @Prop({ required: true, immutable: true }) sourceId!: string;
  @Prop({ required: true, maxlength: 120 }) title!: string;
  // Only server-signed generation results reach this immutable snapshot.
  @Prop({ type: MongoSchema.Types.Mixed, required: true, immutable: true }) result!: RecipeSnapshot;
  @Prop({ type: [String], default: [] }) checkedProductIds!: string[];
  @Prop({ type: [String], default: [] }) checkedItemIds!: string[];
  @Prop({ required: true, type: Date, immutable: true }) generatedAt!: Date;
  createdAt!: Date;
}
export const SavedRecipeSchema = SchemaFactory.createForClass(SavedRecipe);
SavedRecipeSchema.index({ ownerId: 1, sourceId: 1 }, { unique: true });
SavedRecipeSchema.index({ ownerId: 1, createdAt: -1, _id: -1 });
