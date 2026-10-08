import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
        retryAttempts: 3,
        retryDelay: 1000,
        bufferCommands: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
