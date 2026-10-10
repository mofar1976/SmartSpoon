import { Module } from '@nestjs/common';
import { SavedRecipesModule } from '../saved-recipes/saved-recipes.module';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { PantryRecipesController } from './pantry-recipes.controller';
import { PantryRecipesService } from './pantry-recipes.service';

@Module({
  imports: [AuthModule, AiModule, SavedRecipesModule],
  controllers: [PantryRecipesController],
  providers: [PantryRecipesService],
})
export class PantryRecipesModule {}
