import { Module } from '@nestjs/common'
import { NotificationModule } from '../notification/notification.module.js'
import { VerifyApplicationWhenReadyUseCase } from './application/use-cases/verify-when-ready/verify-when-ready.use-case.js'
import { IAdmissionVerificationRepository } from './domain/repositories/admission-verification.repository.js'
import { PrismaAdmissionVerificationRepository } from './infrastructure/persistence/prisma/prisma-admission-verification.repository.js'

@Module({
  imports: [NotificationModule],
  providers: [
    {
      provide: IAdmissionVerificationRepository,
      useClass: PrismaAdmissionVerificationRepository,
    },
    VerifyApplicationWhenReadyUseCase,
  ],
  exports: [VerifyApplicationWhenReadyUseCase],
})
export class VerificationModule {}
