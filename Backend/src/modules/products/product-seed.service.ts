import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './schemas/product.schema';
import { TEST_PRODUCTS } from './data/test-products';

@Injectable()
export class ProductSeedService {
  constructor(@InjectModel(Product.name) private readonly products: Model<Product>) {}

  async seed() {
    await this.products.init();
    // Validate all fixtures before writing; existing entries are never overwritten.
    await Promise.all(TEST_PRODUCTS.map(product => new this.products(product).validate()));
    const result = await this.products.bulkWrite(TEST_PRODUCTS.map(product => ({
      updateOne: {
        filter: { sku: product.sku, priceType: 'test' },
        update: { $setOnInsert: product },
        upsert: true,
        timestamps: false,
      },
    })));
    // Enrich old test fixtures only where metadata is absent; prices and existing fields remain untouched.
    const metadataFields = ['ingredientKey', 'dietaryTags', 'allergens'] as const;
    const enrichment = await this.products.bulkWrite(TEST_PRODUCTS.flatMap(product => metadataFields.map(field => ({
      updateOne: {
        filter: { sku: product.sku, priceType: 'test', name: product.name, packageQuantity: product.packageQuantity, packageUnit: product.packageUnit, [field]: { $exists: false } },
        update: { $set: { [field]: product[field] } },
        timestamps: false,
      },
    }))));
    return { metadataFieldsAdded: enrichment.modifiedCount, inserted: result.upsertedCount, existing: result.matchedCount, totalFixtures: TEST_PRODUCTS.length };
  }
}
