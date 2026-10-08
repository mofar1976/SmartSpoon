import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Supermarket } from '../supermarkets';

// Convert only digit strings; reject empty strings, arrays and query objects.
const queryInteger = ({ value }: { value: unknown }) => typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;

export class ListProductsDto {
  @ApiPropertyOptional({ enum: Supermarket })
  @IsOptional()
  @IsEnum(Supermarket)
  supermarket?: Supermarket;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @Transform(queryInteger)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;

  @ApiPropertyOptional({ default: 0, minimum: 0, maximum: 100000 })
  @Transform(queryInteger)
  @IsInt()
  @Min(0)
  @Max(100000)
  offset: number = 0;
}

export class ProductIdDto {
  @ApiProperty({ description: 'MongoDB-ID des Produkts.' })
  @IsMongoId()
  id!: string;
}
