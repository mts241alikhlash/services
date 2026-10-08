import { Module } from '@nestjs/common'
import { AuthModule } from '../../platform/auth/auth.module.js'
import { ApplicationModule } from '../application/application.module.js'
import { NotificationModule } from '../notification/notification.module.js'
import { VerificationModule } from '../verification/verification.module.js'
import { AcceptManyUseCase } from './application/use-cases/accept-many/accept-many.use-case.js'
import { CancelAcceptanceUseCase } from './application/use-cases/cancel-acceptance/cancel-acceptance.use-case.js'
import { CancelRejectionUseCase } from './application/use-cases/cancel-rejection/cancel-rejection.use-case.js'
import { GetDecisionQueueUseCase } from './application/use-cases/get-decision-queue/get-decision-queue.use-case.js'
import { RejectFromQueueUseCase } from './application/use-cases/reject-from-queue/reject-from-queue.use-case.js'
import { IAdmissionDecisionRepository } from './domain/repositories/admission-decision.repository.js'
import { PrismaAdmissionDecisionRepository } from './infrastructure/persistence/prisma/prisma-admission-decision.repository.js'
import { AdmissionDecisionController } from './presentation/http/admission-decision.controller.js'

@Module({
  imports: [
    AuthModule,
    ApplicationModule,
    NotificationModule,
    VerificationModule,
  ],
  controllers: [AdmissionDecisionController],
  providers: [
    {
      provide: IAdmissionDecisionRepository,
      useClass: PrismaAdmissionDecisionRepository,
    },
    GetDecisionQueueUseCase,
    RejectFromQueueUseCase,
    AcceptManyUseCase,
    CancelAcceptanceUseCase,
    CancelRejectionUseCase,
  ],
})
export class DecisionModule {}
