import { ApiProperty } from '@nestjs/swagger';

export class RecognizedIngredientDto {
  @ApiProperty({ example: 'Banane', maxLength: 300 })
  name!: string;

  @ApiProperty({ example: 'Gelbe, gekrümmte Frucht sichtbar.', maxLength: 300 })
  evidence!: string;
}

export class RecognitionResponseDto {
  @ApiProperty({ example: 'qwen3-vl:4b-instruct' })
  model!: string;

  @ApiProperty({
    enum: [true],
    description: 'Nutzer müssen die Zutatenliste vor Verwendung bestätigen.',
  })
  requiresConfirmation!: true;

  @ApiProperty({ type: [RecognizedIngredientDto], maxItems: 40 })
  ingredients!: RecognizedIngredientDto[];

  @ApiProperty({ type: [String], maxItems: 40 })
  uncertainItems!: string[];
}
