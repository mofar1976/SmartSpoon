import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

export interface AuthenticatedRequest {
  headers: { authorization?: string };
  user: { id: string; username: string; birthDate: string | null };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const match = /^Bearer (\S+)$/i.exec(request.headers.authorization ?? '');
    if (!match) throw new UnauthorizedException('Anmeldung erforderlich.');
    let payload: { sub?: unknown };
    try {
      payload = await this.jwt.verifyAsync(match[1], { algorithms: ['HS256'], issuer: 'kochfaul', audience: 'kochfaul-api' });
    } catch {
      throw new UnauthorizedException('Token ist ungültig oder abgelaufen.');
    }
    if (typeof payload.sub !== 'string') throw new UnauthorizedException('Ungültiger Zugang.');
    request.user = await this.auth.findUser(payload.sub);
    return true;
  }
}
