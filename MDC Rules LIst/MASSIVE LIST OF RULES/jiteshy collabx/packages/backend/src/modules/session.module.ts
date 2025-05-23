import { Module } from '@nestjs/common';
import { RedisService } from '../services/redis.service';
import { SessionService } from '../services/session.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [RedisService, SessionService],
  exports: [SessionService, RedisService],
})
export class SessionModule {}
