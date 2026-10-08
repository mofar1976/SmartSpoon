import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Prüft, ob die HTTP-Anwendung erreichbar ist.' })
  check(): { status: string; service: string } {
    return { status: 'ok', service: 'kochfaul-backend' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Prüft die Datenbankbereitschaft mit einem MongoDB-Ping.' })
  @ApiResponse({ status: 200, description: 'Datenbank erreichbar.' })
  @ApiResponse({ status: 503, description: 'Datenbank nicht erreichbar.' })
  ready() {
    return this.health.readiness();
  }
}
