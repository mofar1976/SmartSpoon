import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { ProductsService } from './products.service';
import { ListProductsDto, ProductIdDto } from './dto/list-products.dto';
import { ProductListResponseDto, ProductResponseDto } from './dto/product-response.dto';
import { SUPERMARKETS } from './supermarkets';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get('supermarkets')
  @ApiOperation({ summary: 'Supermärkte des Testkatalogs auflisten.' })
  supermarkets() { return SUPERMARKETS; }

  @Get()
  @ApiOperation({ summary: 'Produkte mit fiktiven Testpreisen abrufen, optional nach Supermarkt filtern.' })
  @ApiOkResponse({ type: ProductListResponseDto })
  @ApiResponse({ status: 400, description: 'Ungültiger Filter oder Seiteneinteilung.' })
  list(@Query() query: ListProductsDto) { return this.products.list(query); }

  @Get(':id')
  @ApiOperation({ summary: 'Ein Produkt mit fiktivem Testpreis abrufen.' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Produkt nicht gefunden.' })
  findOne(@Param() params: ProductIdDto) { return this.products.findOne(params.id); }
}
