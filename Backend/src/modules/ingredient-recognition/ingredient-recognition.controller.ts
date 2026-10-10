import {
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthGuard } from '../auth/auth.guard';
import { RecognitionResponseDto } from './dto/recognition-response.dto';
import { IngredientRecognitionService, MAX_IMAGE_BYTES } from './ingredient-recognition.service';

@ApiTags('ingredient-recognition')
@ApiBearerAuth()
@UseGuards(AuthGuard, ThrottlerGuard)
@Controller('ingredient-recognition')
export class IngredientRecognitionController {
  constructor(private readonly recognition: IngredientRecognitionService) {}

  @Post()
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 0, parts: 1 },
    }),
  )
  @ApiOperation({
    summary:
      'Foto analysieren; erkannte Zutaten müssen anschließend bestätigt werden. Fotos werden nicht gespeichert.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image'],
      properties: { image: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ type: RecognitionResponseDto })
  @ApiResponse({ status: 401, description: 'Anmeldung erforderlich.' })
  @ApiResponse({ status: 413, description: 'Foto größer als 10 MiB.' })
  @ApiResponse({ status: 422, description: 'Ungültiges Bildformat oder nicht lesbares Bild.' })
  @ApiResponse({ status: 429, description: 'Anfragelimit erreicht oder Erkennung beschäftigt.' })
  @ApiResponse({
    status: 503,
    description: 'Erkennungsdienst nicht verfügbar oder nicht konfiguriert.',
  })
  async recognize(@UploadedFile() file?: Express.Multer.File): Promise<RecognitionResponseDto> {
    return this.recognition.recognize(file);
  }
}
