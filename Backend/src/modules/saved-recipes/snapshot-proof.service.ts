import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'node:crypto';
import { RecipeGenerationResponseDto } from '../recipes/dto/recipe-response.dto';

export type RecipeSnapshot = Omit<RecipeGenerationResponseDto, 'saveProof'>;
// Stable object key order lets clients serialize the same response in any key order.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return (
      '{' +
      Object.keys(object)
        .sort()
        .map((key) => JSON.stringify(key) + ':' + canonical(object[key]))
        .join(',') +
      '}'
    );
  }
  return JSON.stringify(value) ?? 'null';
}
const digest = (value: unknown) => createHash('sha256').update(canonical(value)).digest('hex');
const audience = 'kochfaul-save-recipes';

@Injectable()
export class SnapshotProofService {
  constructor(private readonly jwt: JwtService) {}
  async issue(result: RecipeSnapshot, ownerId: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: ownerId, digest: digest(result) },
      { audience, issuer: 'kochfaul', algorithm: 'HS256', expiresIn: '24h', jwtid: randomUUID() },
    );
  }
  async verify(response: RecipeGenerationResponseDto, ownerId: string) {
    try {
      const { saveProof, ...snapshot } = response;
      if (typeof saveProof !== 'string' || saveProof.length > 2048) throw new Error();
      const claims = await this.jwt.verifyAsync<{
        sub: string;
        digest: string;
        jti: string;
        iat: number;
      }>(saveProof, { algorithms: ['HS256'], issuer: 'kochfaul', audience });
      if (
        claims.sub !== ownerId ||
        typeof claims.jti !== 'string' ||
        !Number.isInteger(claims.iat) ||
        claims.digest !== digest(snapshot)
      )
        throw new Error();
      return { snapshot, sourceId: claims.jti, generatedAt: new Date(claims.iat * 1000) };
    } catch {
      throw new BadRequestException(
        'Diese Rezeptauswahl ist verändert, gehört nicht zu deinem Konto oder ihr Speichernachweis ist abgelaufen. Bitte eine neue Auswahl erstellen.',
      );
    }
  }
}
