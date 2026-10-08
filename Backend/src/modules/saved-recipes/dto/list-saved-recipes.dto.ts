import { Transform } from 'class-transformer';
import { IsInt, IsMongoId, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const integer = ({ value }: { value: unknown }) =>
  typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
export class ListSavedRecipesDto {
  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50 })
  @Transform(integer)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
  @ApiPropertyOptional({ default: 0, minimum: 0, maximum: 100000 })
  @Transform(integer)
  @IsInt()
  @Min(0)
  @Max(100000)
  offset = 0;
}

export class SavedRecipeIdDto {
  @ApiProperty({ description: 'MongoDB-ID der gespeicherten Rezeptauswahl.' })
  @IsMongoId()
  id!: string;
}
