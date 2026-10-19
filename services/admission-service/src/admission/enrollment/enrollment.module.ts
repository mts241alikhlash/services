import { Module } from '@nestjs/common'
import { AuthModule } from '../../platform/auth/auth.module.js'
import { ReferenceLookupModule } from '../../platform/reference-lookup/reference-lookup.module.js'
import { ApplicationModule } from '../application/application.module.js'
import { ComposeNisUseCase } from './application/use-cases/compose-nis/compose-nis.use-case.js'
import { GetEnrollmentQueueUseCase } from './application/use-cases/get-enrollment-queue/get-enrollment-queue.use-case.js'
import { LockNisUseCase } from './application/use-cases/lock-nis/lock-nis.use-case.js'
import { PreviewNisUseCase } from './application/use-cases/preview-nis/preview-nis.use-case.js'
import { ProcessEnrollmentsUseCase } from './application/use-cases/process-enrollments/process-enrollments.use-case.js'
import { SetPlacementUseCase } from './application/use-cases/set-placement/set-placement.use-case.js'
import { IAdmissionEnrollmentRepository } from './domain/repositories/admission-enrollment.repository.js'
import { PrismaAdmissionEnrollmentRepository } from './infrastructure/persistence/prisma/prisma-admission-enrollment.repository.js'
import { AdmissionEnrollmentController } from './presentation/http/admission-enrollment.controller.js'

@Module({
  imports: [AuthModule, ApplicationModule, ReferenceLookupModule],
  controllers: [AdmissionEnrollmentController],
  providers: [
    {
      provide: IAdmissionEnrollmentRepository,
      useClass: PrismaAdmissionEnrollmentRepository,
    },
    GetEnrollmentQueueUseCase,
    SetPlacementUseCase,
    PreviewNisUseCase,
    ComposeNisUseCase,
    LockNisUseCase,
    ProcessEnrollmentsUseCase,
  ],
})
export class EnrollmentModule {}
