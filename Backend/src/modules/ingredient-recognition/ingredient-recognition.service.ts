import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  HttpException,
  Injectable,
  PayloadTooLargeException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const text = z.string().trim().min(1).max(300);
const resultSchema = z.object({
  model: z.string().min(1).max(100),
  requiresConfirmation: z.literal(true),
  ingredients: z.array(z.object({ name: text, evidence: text }).strict()).max(40),
  uncertainItems: z.array(text).max(40),
});

@Injectable()
export class IngredientRecognitionService {
  constructor(private readonly config: ConfigService) {}

  async recognize(file?: Express.Multer.File) {
    if (!file?.buffer?.length)
      throw new BadRequestException({
        code: 'IMAGE_REQUIRED',
        message: 'Bitte ein Foto hochladen.',
      });
    if (file.buffer.length > MAX_IMAGE_BYTES)
      throw new PayloadTooLargeException({
        code: 'IMAGE_SIZE_LIMIT',
        message: 'Das Foto darf höchstens 10 MiB groß sein.',
      });
    const mime = this.imageType(file.buffer);
    const token = this.config.get<string>('INGREDIENT_RECOGNITION_TOKEN');
    if (!token)
      throw new ServiceUnavailableException({
        code: 'RECOGNITION_NOT_CONFIGURED',
        message: 'Die Fotoerkennung ist noch nicht eingerichtet.',
      });
    const url = this.config.getOrThrow<string>('INGREDIENT_RECOGNITION_URL');
    const signal = AbortSignal.timeout(
      this.config.getOrThrow<number>('INGREDIENT_RECOGNITION_TIMEOUT_MS'),
    );
    let response: Response;
    let value: unknown;
    try {
      response = await fetch(url + '/recognize', {
        method: 'POST',
        redirect: 'error',
        signal,
        headers: { 'Content-Type': mime, Authorization: 'Bearer ' + token },
        body: new Uint8Array(file.buffer),
      });
      if (!response.ok) {
        await response.body?.cancel();
        this.raiseServiceError(response.status);
      }
      // Bound even a misbehaving internal service's response; no image/result logging.
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Missing response');
      const chunks: Uint8Array[] = [];
      let bytes = 0;
      for (;;) {
        const { value: chunk, done } = await reader.read();
        if (done) break;
        bytes += chunk.byteLength;
        if (bytes > 64 * 1024) {
          await reader.cancel();
          throw new Error('Oversized response');
        }
        chunks.push(chunk);
      }
      value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (signal.aborted)
        throw new GatewayTimeoutException({
          code: 'RECOGNITION_TIMEOUT',
          message: 'Die Fotoerkennung hat zu lange gedauert.',
        });
      if (
        error instanceof SyntaxError ||
        (error instanceof Error && /response/i.test(error.message))
      ) {
        throw new BadGatewayException({
          code: 'INVALID_MODEL_RESULT',
          message: 'Die Fotoerkennung hat keine gültige Antwort geliefert.',
        });
      }
      throw new ServiceUnavailableException({
        code: 'MODEL_UNAVAILABLE',
        message: 'Die Fotoerkennung ist momentan nicht erreichbar.',
      });
    }
    const result = resultSchema.safeParse(value);
    if (!result.success)
      throw new BadGatewayException({
        code: 'INVALID_MODEL_RESULT',
        message: 'Die Fotoerkennung hat keine gültige Zutatenliste geliefert.',
      });
    return result.data;
  }

  private imageType(data: Buffer): string {
    if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff)
      return 'image/jpeg';
    if (
      data.length >= 8 &&
      data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      return 'image/png';
    if (
      data.length >= 12 &&
      data.toString('ascii', 0, 4) === 'RIFF' &&
      data.toString('ascii', 8, 12) === 'WEBP'
    )
      return 'image/webp';
    throw new UnprocessableEntityException({
      code: 'INVALID_IMAGE',
      message: 'Bitte ein gültiges JPEG-, PNG- oder WebP-Foto hochladen.',
    });
  }

  private raiseServiceError(status: number): never {
    if (status === 422 || status === 415)
      throw new UnprocessableEntityException({
        code: 'INVALID_IMAGE',
        message: 'Das Foto konnte nicht gelesen werden. JPEG, PNG oder WebP verwenden.',
      });
    if (status === 413)
      throw new PayloadTooLargeException({
        code: 'IMAGE_SIZE_LIMIT',
        message: 'Das Foto ist zu groß.',
      });
    if (status === 429)
      throw new HttpException(
        {
          code: 'RECOGNITION_BUSY',
          message: 'Die Fotoerkennung ist gerade beschäftigt. Bitte erneut versuchen.',
        },
        429,
      );
    if (status === 504 || status === 408)
      throw new GatewayTimeoutException({
        code: 'RECOGNITION_TIMEOUT',
        message: 'Die Fotoerkennung hat zu lange gedauert.',
      });
    if (status === 502)
      throw new BadGatewayException({
        code: 'INVALID_MODEL_RESULT',
        message: 'Die Fotoerkennung hat keine gültige Antwort geliefert.',
      });
    throw new ServiceUnavailableException({
      code: 'MODEL_UNAVAILABLE',
      message: 'Die Fotoerkennung ist momentan nicht verfügbar.',
    });
  }
}
