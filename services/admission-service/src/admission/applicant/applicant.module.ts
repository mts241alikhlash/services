import { Module } from '@nestjs/common'
import { UserModule } from '../../platform/user/user.module.js'
import { NotificationModule } from '../notification/notification.module.js'
import { PrismaAdmissionApplicantRepository } from './infrastructure/persistence/prisma/prisma-admission-applicant.repository.js'
import { PrismaAdmissionApplicantReader } from './infrastructure/persistence/prisma/prisma-admission-applicant.reader.js'
import { PrismaAdmissionApplicantWriter } from './infrastructure/persistence/prisma/prisma-admission-applicant.writer.js'
import { IAdmissionApplicantRepository } from './domain/repositories/admission-applicant-repository.js'
import { EnsureMyApplicationUseCase } from './application/use-cases/ensure-my-application/ensure-my-application.use-case.js'
import { GetMyApplicationUseCase } from './application/use-cases/get-my-application/get-my-application.use-case.js'
import { RegisterApplicantUseCase } from './application/use-cases/register-applicant/register-applicant.use-case.js'
import { SubmitApplicationUseCase } from './application/use-cases/submit-application/submit-application.use-case.js'
import { UpdateMyApplicationUseCase } from './application/use-cases/update-my-application/update-my-application.use-case.js'

@Module({
  imports: [UserModule, NotificationModule],
  providers: [
    PrismaAdmissionApplicantReader,
    PrismaAdmissionApplicantWriter,
    {
      provide: IAdmissionApplicantRepository,
      useClass: PrismaAdmissionApplicantRepository,
    },
    RegisterApplicantUseCase,
    GetMyApplicationUseCase,
    EnsureMyApplicationUseCase,
    UpdateMyApplicationUseCase,
    SubmitApplicationUseCase,
  ],
  exports: [
    IAdmissionApplicantRepository,
    RegisterApplicantUseCase,
    GetMyApplicationUseCase,
    EnsureMyApplicationUseCase,
    UpdateMyApplicationUseCase,
    SubmitApplicationUseCase,
  ],
})
export class ApplicantModule {}
