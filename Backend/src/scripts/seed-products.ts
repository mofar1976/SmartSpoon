import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ProductSeedService } from '../modules/products/product-seed.service';
import { TEST_PRICE_NOTICE } from '../modules/products/supermarkets';

async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const result = await app.get(ProductSeedService).seed();
    console.log(TEST_PRICE_NOTICE);
    console.log(JSON.stringify(result));
  } finally {
    await app.close();
  }
}

seed().catch(() => {
  console.error('Testkatalog konnte nicht geladen werden. Bitte Datenbankverbindung und Konfiguration prüfen.');
  process.exitCode = 1;
});
