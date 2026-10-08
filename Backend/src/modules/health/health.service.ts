import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class HealthService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async readiness(): Promise<{ status: string; database: string }> {
    try {
      if (this.connection.readyState !== 1 || !this.connection.db) {
        throw new Error('Database disconnected');
      }
      await this.connection.db.command({ ping: 1 }, { timeoutMS: 2000 });
      return { status: 'ok', database: 'up' };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'down' });
    }
  }
}
