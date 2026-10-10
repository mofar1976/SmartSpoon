import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { IngredientRecognitionController } from './ingredient-recognition.controller';
import { IngredientRecognitionService } from './ingredient-recognition.service';

@Module({
  imports: [AuthModule],
  controllers: [IngredientRecognitionController],
  providers: [IngredientRecognitionService],
})
export class IngredientRecognitionModule {}
