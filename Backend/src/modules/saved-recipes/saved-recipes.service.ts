import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { SavedRecipe } from './schemas/saved-recipe.schema';
import { SaveRecipesDto } from './dto/save-recipes.dto';
import { ListSavedRecipesDto } from './dto/list-saved-recipes.dto';
import { isPantrySnapshot, SnapshotProofService } from './snapshot-proof.service';

@Injectable()
export class SavedRecipesService {
  constructor(
    @InjectModel(SavedRecipe.name) private readonly selections: Model<SavedRecipe>,
    private readonly proofs: SnapshotProofService,
  ) {}
  async save(input: SaveRecipesDto, owner: string) {
    const { snapshot, sourceId, generatedAt } = await this.proofs.verify(input.result, owner);
    const checkedProductIds = input.checkedProductIds ?? [];
    const checkedItemIds = input.checkedItemIds ?? [];
    if (isPantrySnapshot(snapshot)) {
      const known = new Set(
        snapshot.recipes.flatMap((recipe) => recipe.shoppingList.map((item) => item.id)),
      );
      if (checkedProductIds.length || checkedItemIds.some((id) => !known.has(id)))
        throw new BadRequestException(
          'Abgehakte Vorratsartikel müssen zu den Rezept-Einkaufslisten gehören.',
        );
    } else {
      const known = new Set(snapshot.shoppingList.map((item) => item.product.id));
      if (checkedItemIds.length || checkedProductIds.some((id) => !known.has(id)))
        throw new BadRequestException('Abgehakte Produkte müssen zu dieser Einkaufsliste gehören.');
    }
    const filter = { ownerId: new Types.ObjectId(owner), sourceId };
    const data = {
      ...filter,
      title: input.title ?? snapshot.recipes[0].title,
      result: snapshot,
      checkedProductIds,
      checkedItemIds,
      generatedAt,
    };
    let document;
    try {
      document = await this.selections
        .findOneAndUpdate(
          filter,
          { $setOnInsert: data },
          { upsert: true, new: true, runValidators: true },
        )
        .exec();
    } catch (error) {
      // Concurrent save clicks share the same unique source ID.
      if ((error as { code?: number }).code !== 11000) throw error;
      document = await this.selections.findOne(filter).exec();
      if (!document) throw error;
    }
    return this.detail(document!);
  }
  async list(query: ListSavedRecipesDto, owner: string) {
    const filter = { ownerId: new Types.ObjectId(owner) };
    const [items, total] = await Promise.all([
      this.selections
        .find(filter)
        .select(
          'title generatedAt createdAt result.mode result.totalCostCents result.currency result.priceType result.recipes.title',
        )
        .sort({ createdAt: -1, _id: -1 })
        .skip(query.offset)
        .limit(query.limit)
        .exec(),
      this.selections.countDocuments(filter).exec(),
    ]);
    return {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        generatedAt: item.generatedAt.toISOString(),
        createdAt: item.createdAt.toISOString(),
        mode: isPantrySnapshot(item.result) ? 'pantry' : 'market',
        ...(isPantrySnapshot(item.result)
          ? {}
          : {
              totalCostCents: item.result.totalCostCents,
              currency: item.result.currency,
              priceType: item.result.priceType,
            }),
        recipeTitles: item.result.recipes.map((recipe) => recipe.title),
      })),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }
  async findOne(id: string, owner: string) {
    const document = await this.selections
      .findOne({ _id: new Types.ObjectId(id), ownerId: new Types.ObjectId(owner) })
      .exec();
    if (!document) throw new NotFoundException('Gespeicherte Rezeptauswahl nicht gefunden.');
    return this.detail(document);
  }
  async remove(id: string, owner: string): Promise<void> {
    const result = await this.selections
      .deleteOne({ _id: new Types.ObjectId(id), ownerId: new Types.ObjectId(owner) })
      .exec();
    if (!result.deletedCount)
      throw new NotFoundException('Gespeicherte Rezeptauswahl nicht gefunden.');
  }
  private detail(document: HydratedDocument<SavedRecipe>) {
    return {
      id: document.id as string,
      title: document.title,
      generatedAt: document.generatedAt.toISOString(),
      createdAt: document.createdAt.toISOString(),
      mode: isPantrySnapshot(document.result) ? 'pantry' : 'market',
      result: document.result,
      checkedProductIds: document.checkedProductIds ?? [],
      checkedItemIds: document.checkedItemIds ?? [],
    };
  }
}
