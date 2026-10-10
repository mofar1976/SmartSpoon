import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard';
import { GeneratePantryRecipesDto } from './dto/generate-pantry-recipes.dto';
import { PantryRecipesResponseDto } from './dto/pantry-recipes-response.dto';
import { PantryRecipesService } from './pantry-recipes.service';

@ApiTags('pantry-recipes')
@ApiBearerAuth()
@UseGuards(AuthGuard, ThrottlerGuard)
@Controller('pantry-recipes')
export class PantryRecipesController {
  constructor(private readonly recipes: PantryRecipesService) {}

  @Post('generate')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Rezeptalternativen aus bestätigten Vorratszutaten erstellen, ohne Bilder oder Preise.',
  })
  @ApiOkResponse({
    type: PantryRecipesResponseDto,
    description:
      'Rezeptalternativen mit Zutatenquellen und separater Einkaufsliste je Rezept; keine Preise, mit nutzergebundenem Speichernachweis.',
  })
  @ApiResponse({
    status: 422,
    description: 'Keine Auswahl innerhalb der bestätigten Mengen und Vorgaben möglich.',
  })
  async generate(
    @Body() request: GeneratePantryRecipesDto,
    @Req() auth: AuthenticatedRequest,
  ): Promise<PantryRecipesResponseDto> {
    return this.recipes.generate(request, auth.user.birthDate, auth.user.id);
  }
}
