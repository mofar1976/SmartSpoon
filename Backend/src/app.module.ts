import { PantryRecipesModule } from './modules/pantry-recipes/pantry-recipes.module';
import { IngredientRecognitionModule } from './modules/ingredient-recognition/ingredient-recognition.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './config/environment';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { ProductsModule } from './modules/products/products.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    ProductsModule,
    RecipesModule,
    IngredientRecognitionModule,
    PantryRecipesModule,
  ],
})
export class AppModule {}
