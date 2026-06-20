import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './core/prisma/prisma.module';
import { AuthModule } from './features/auth/auth.module';
import { CivicModule } from './features/civic/civic.module';
import { AiModule } from './features/ai/ai.module';
import { AdminModule } from './features/admin/admin.module';
import { StorageModule } from './features/storage/storage.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    CivicModule,
    AiModule,
    AdminModule,
    StorageModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
