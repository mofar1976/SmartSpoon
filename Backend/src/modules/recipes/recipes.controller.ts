import { SnapshotProofService } from '../saved-recipes/snapshot-proof.service';
import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { GenerateRecipesDto } from './dto/generate-recipes.dto';
import { RecipeGenerationResponseDto } from './dto/recipe-response.dto';
import { RecipesService } from './recipes.service';

@ApiTags('recipes')
@ApiBearerAuth()
@UseGuards(AuthGuard, ThrottlerGuard)
@Controller('recipes')
export class RecipesController {
  constructor(
    private readonly recipes: RecipesService,
    private readonly proofs: SnapshotProofService,
  ) {}

  @Post('generate')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Rezepte und Einkaufsliste für die aktuellen Angaben erstellen; Eingaben werden nicht gespeichert.',
  })
  @ApiResponse({
    status: 200,
    type: RecipeGenerationResponseDto,
    description: 'Validierte Rezepte mit Einkaufsliste und vom Backend berechneten Centbeträgen.',
  })
  @ApiResponse({
    status: 422,
    description: 'Kein passender Katalog oder keine Auswahl innerhalb der Vorgaben.',
  })
  @ApiResponse({
    status: 503,
    description: 'Gemini nicht konfiguriert, nicht verfügbar oder Kontingent erschöpft.',
  })
  @ApiResponse({
    status: 502,
    description: 'Ungültige KI-Antwort oder fehlgeschlagener KI-Aufruf.',
  })
  async generate(@Body() preferences: GenerateRecipesDto, @Req() request: AuthenticatedRequest) {
    const result = await this.recipes.generate(preferences, request.user.birthDate);
    return { ...result, saveProof: await this.proofs.issue(result, request.user.id) };
  }
}
