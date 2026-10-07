import { Module } from '@nestjs/common'
import { AuthModule } from '../../platform/auth/auth.module.js'
import { NotificationModule } from '../notification/notification.module.js'
import { VerificationModule } from '../verification/verification.module.js'
import { GetDocumentReviewQueueUseCase } from './application/use-cases/get-document-review-queue/get-document-review-queue.use-case.js'
import { GetDocumentReviewUseCase } from './application/use-cases/get-document-review/get-document-review.use-case.js'
import { SaveDocumentDecisionUseCase } from './application/use-cases/save-document-decision/save-document-decision.use-case.js'
import { SendDocumentReviewUseCase } from './application/use-cases/send-document-review/send-document-review.use-case.js'
import { IAdmissionDocumentReviewRepository } from './domain/repositories/admission-document-review.repository.js'
import { PrismaAdmissionDocumentReviewRepository } from './infrastructure/persistence/prisma/prisma-admission-document-review.repository.js'
import { AdmissionDocumentReviewController } from './presentation/http/admission-document-review.controller.js'

@Module({
  imports: [AuthModule, NotificationModule, VerificationModule],
  controllers: [AdmissionDocumentReviewController],
  providers: [
    {
      provide: IAdmissionDocumentReviewRepository,
      useClass: PrismaAdmissionDocumentReviewRepository,
    },
    GetDocumentReviewQueueUseCase,
    GetDocumentReviewUseCase,
    SaveDocumentDecisionUseCase,
    SendDocumentReviewUseCase,
  ],
})
export class DocumentReviewModule {}
