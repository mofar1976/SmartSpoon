import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard';
import { SaveRecipesDto } from './dto/save-recipes.dto';
import { ListSavedRecipesDto, SavedRecipeIdDto } from './dto/list-saved-recipes.dto';
import { SavedRecipeResponseDto, SavedRecipeListDto } from './dto/saved-recipes-response.dto';
import { SavedRecipesService } from './saved-recipes.service';

@ApiTags('saved-recipes')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Anmeldung erforderlich.' })
@UseGuards(AuthGuard)
@Controller('saved-recipes')
export class SavedRecipesController {
  constructor(private readonly selections: SavedRecipesService) {}
  @Post()
  @ApiOperation({
    summary:
      'Eigene generierte Rezeptauswahl samt Einkaufsliste dauerhaft speichern; wiederholtes Speichern derselben Generierung erzeugt kein Duplikat.',
  })
  @ApiResponse({ status: 201, type: SavedRecipeResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Ungültige Eingabe, abgelaufener/fremder Nachweis oder verändertes Ergebnis.',
  })
  save(@Body() input: SaveRecipesDto, @Req() request: AuthenticatedRequest) {
    return this.selections.save(input, request.user.id);
  }
  @Get()
  @ApiResponse({ status: 200, type: SavedRecipeListDto })
  list(@Query() query: ListSavedRecipesDto, @Req() request: AuthenticatedRequest) {
    return this.selections.list(query, request.user.id);
  }
  @Get(':id')
  @ApiResponse({ status: 200, type: SavedRecipeResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Auswahl existiert nicht oder gehört einem anderen Nutzer.',
  })
  findOne(@Param() params: SavedRecipeIdDto, @Req() request: AuthenticatedRequest) {
    return this.selections.findOne(params.id, request.user.id);
  }
  @Delete(':id')
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Eigene Auswahl gelöscht.' })
  @ApiResponse({
    status: 404,
    description: 'Auswahl existiert nicht oder gehört einem anderen Nutzer.',
  })
  remove(@Param() params: SavedRecipeIdDto, @Req() request: AuthenticatedRequest) {
    return this.selections.remove(params.id, request.user.id);
  }
}
