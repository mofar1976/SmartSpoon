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
  ],
  exports: [RECIPE_PROVIDER],
})
export class AiModule {}
