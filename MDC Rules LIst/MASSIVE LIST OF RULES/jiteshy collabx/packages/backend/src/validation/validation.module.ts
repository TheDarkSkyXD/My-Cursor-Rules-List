import { Module } from '@nestjs/common';
import { ValidationService } from '@collabx/shared';

@Module({
  providers: [ValidationService],
  exports: [ValidationService],
})
export class ValidationModule {}
