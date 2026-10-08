import { SavedRecipesModule } from '../saved-recipes/saved-recipes.module';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../ai/ai.module';
import { ProductsModule } from '../products/products.module';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { BudgetService } from './budget.service';

@Module({
  imports: [AuthModule, AiModule, ProductsModule, SavedRecipesModule],
  controllers: [RecipesController],
  providers: [RecipesService, BudgetService],
})
export class RecipesModule {}
