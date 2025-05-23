import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EditorGateway } from './gateways/editor.gateway';
import { SessionModule } from './modules/session.module';
import { HealthController } from './health/health.controller';
import { RedisRateLimiter } from './rate-limit/redis-rate-limiter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SessionModule,
  ],
  controllers: [HealthController],
  providers: [EditorGateway, RedisRateLimiter],
})
export class AppModule {}
