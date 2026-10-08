import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthGuard, AuthenticatedRequest } from './auth.guard';
import { RegisterDto } from './dto/register.dto';
import { CredentialsDto } from './dto/credentials.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Mit Benutzername, Passwort und Geburtsdatum registrieren.' })
  @ApiResponse({ status: 201, description: 'Benutzer erstellt; Zugangstoken zurückgegeben.' })
  @ApiResponse({ status: 409, description: 'Benutzername bereits vergeben.' })
  register(@Body() credentials: RegisterDto) { return this.auth.register(credentials); }

  @Post('login')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Anmelden und Zugangstoken erhalten.' })
  @ApiResponse({ status: 401, description: 'Ungültige Zugangsdaten.' })
  login(@Body() credentials: CredentialsDto) { return this.auth.login(credentials); }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aktuell angemeldeten Benutzer abrufen.' })
  me(@Req() request: AuthenticatedRequest) { return request.user; }
}
