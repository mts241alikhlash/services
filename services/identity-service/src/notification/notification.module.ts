import { Module } from '@nestjs/common'
import { EmailService } from './application/services/email.service.js'

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class NotificationModule {}
