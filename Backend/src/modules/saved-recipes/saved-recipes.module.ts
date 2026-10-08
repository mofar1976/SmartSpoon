import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { SavedRecipe, SavedRecipeSchema } from './schemas/saved-recipe.schema';
import { SavedRecipesController } from './saved-recipes.controller';
import { SavedRecipesService } from './saved-recipes.service';
import { SnapshotProofService } from './snapshot-proof.service';
@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: SavedRecipe.name, schema: SavedRecipeSchema }]),
  ],
  controllers: [SavedRecipesController],
  providers: [SavedRecipesService, SnapshotProofService],
  exports: [SnapshotProofService],
})
export class SavedRecipesModule {}
