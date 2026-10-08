import { Module } from '@nestjs/common'
import { AuthModule } from '../../platform/auth/auth.module.js'
import { ReferenceLookupModule } from '../../platform/reference-lookup/reference-lookup.module.js'
import { ApplicationModule } from '../application/application.module.js'
import { ComposeNisUseCase } from './application/use-cases/compose-nis/compose-nis.use-case.js'
import { GetEnrolmentQueueUseCase } from './application/use-cases/get-enrolment-queue/get-enrolment-queue.use-case.js'
import { LockNisUseCase } from './application/use-cases/lock-nis/lock-nis.use-case.js'
import { PreviewNisUseCase } from './application/use-cases/preview-nis/preview-nis.use-case.js'
import { ProcessEnrolmentsUseCase } from './application/use-cases/process-enrolments/process-enrolments.use-case.js'
import { SetPlacementUseCase } from './application/use-cases/set-placement/set-placement.use-case.js'
import { IAdmissionEnrolmentRepository } from './domain/repositories/admission-enrolment.repository.js'
import { PrismaAdmissionEnrolmentRepository } from './infrastructure/persistence/prisma/prisma-admission-enrolment.repository.js'
import { AdmissionEnrolmentController } from './presentation/http/admission-enrolment.controller.js'

@Module({
  imports: [AuthModule, ApplicationModule, ReferenceLookupModule],
  controllers: [AdmissionEnrolmentController],
  providers: [
    {
      provide: IAdmissionEnrolmentRepository,
      useClass: PrismaAdmissionEnrolmentRepository,
    },
    GetEnrolmentQueueUseCase,
    SetPlacementUseCase,
    PreviewNisUseCase,
    ComposeNisUseCase,
    LockNisUseCase,
    ProcessEnrolmentsUseCase,
  ],
})
export class EnrolmentModule {}
