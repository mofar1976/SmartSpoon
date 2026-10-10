import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { ListProductsDto } from './dto/list-products.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { TEST_PRICE_NOTICE } from './supermarkets';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private readonly products: Model<Product>) {}

  async list(query: ListProductsDto) {
    if (query.supermarket != null && (typeof query.supermarket !== 'string' ||
      !['rewe', 'aldi', 'lidl'].includes(query.supermarket)))
      throw new BadRequestException('Ungültiger Supermarkt.');
    const filter = query.supermarket ? { supermarket: { $eq: query.supermarket } } : {};
    const [products, total] = await Promise.all([
      this.products.find(filter).sort({ sku: 1 }).skip(query.offset).limit(query.limit).exec(),
      this.products.countDocuments(filter).exec(),
    ]);
    return { items: products.map(product => this.toResponse(product)), total, limit: query.limit, offset: query.offset, priceNotice: TEST_PRICE_NOTICE };
  }

  async forRecipes(supermarket: import('./supermarkets').Supermarket) {
    if (typeof supermarket !== 'string' || !['rewe', 'aldi', 'lidl'].includes(supermarket))
      throw new BadRequestException('Ungültiger Supermarkt.');
    const products = await this.products.find({ supermarket: { $eq: supermarket } }).sort({ sku: 1 }).limit(100).exec();
    return products.map(product => this.toResponse(product));
  }

  async findOne(id: string) {
    if (typeof id !== 'string' || !/^[a-fA-F0-9]{24}$/.test(id))
      throw new BadRequestException('Ungültige Produkt-ID.');
    const product = await this.products.findOne({ _id: { $eq: id } }).exec();
    if (!product) throw new NotFoundException('Produkt nicht gefunden.');
    return this.toResponse(product);
  }

  private toResponse(product: ProductDocument): ProductResponseDto {
    return {
      id: product.id as string,
      sku: product.sku,
      name: product.name,
      ingredientKey: product.ingredientKey ?? null,
      dietaryTags: product.dietaryTags ?? null,
      allergens: product.allergens ?? null,
      supermarket: product.supermarket,
      packageQuantity: product.packageQuantity,
      packageUnit: product.packageUnit,
      priceCents: product.priceCents,
      currency: product.currency,
      priceType: product.priceType,
      sourceLabel: product.sourceLabel,
      sourceUrl: product.sourceUrl,
      location: product.location,
      observedAt: product.observedAt?.toISOString() ?? null,
    };
  }
}
