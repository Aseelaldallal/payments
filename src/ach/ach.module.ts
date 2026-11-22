import { Module } from '@nestjs/common';
import { AchWindowPolicyService } from './ach-window-policy.service';

@Module({
  providers: [AchWindowPolicyService],
  exports: [AchWindowPolicyService],
})
export class AchModule {}
