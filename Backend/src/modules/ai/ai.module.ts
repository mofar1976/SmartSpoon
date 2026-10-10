import { GeminiPantryProvider } from './gemini-pantry.provider';
import { PANTRY_RECIPE_PROVIDER } from './pantry-recipe-contract';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { GeminiProvider, GEMINI_CLIENT } from './gemini.provider';
import { RECIPE_PROVIDER } from './recipe-contract';

@Module({
  providers: [
    { provide: GEMINI_CLIENT, inject: [ConfigService], useFactory: (config: ConfigService) => {
      const apiKey = config.get<string>('GEMINI_API_KEY');
      return apiKey ? new GoogleGenAI({ apiKey }) : null;
    } },
    { provide: RECIPE_PROVIDER, useClass: GeminiProvider },
    { provide: PANTRY_RECIPE_PROVIDER, useClass: GeminiPantryProvider },
  ],
  exports: [RECIPE_PROVIDER, PANTRY_RECIPE_PROVIDER],
})
export class AiModule {}
