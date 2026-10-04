import { Module } from '@nestjs/common'
import { AuthModule } from '../../platform/auth/auth.module.js'
import { UserModule } from '../../platform/user/user.module.js'
import { ApplicantModule } from '../applicant/applicant.module.js'
import { DocumentModule } from '../document/document.module.js'
import { NotificationModule } from '../notification/notification.module.js'
import { PaymentModule } from '../payment/payment.module.js'
import { IntegrationModule } from './infrastructure/integration/integration.module.js'
import { IAdmissionApplicationRepository } from './domain/repositories/admission-application-repository.js'
import { PrismaAdmissionApplicationRepository } from './infrastructure/persistence/prisma/prisma-admission-application.repository.js'
import { AdmissionAdminController } from './presentation/http/admission-admin.controller.js'
import { AdmissionAdminRegistrationController } from './presentation/http/admission-admin-registration.controller.js'
import { AcceptApplicationUseCase } from './application/use-cases/accept-application/accept-application.use-case.js'
import { EnrollApplicantUseCase } from './application/use-cases/enroll-applicant/enroll-applicant.use-case.js'
import { GetAdmissionStatsUseCase } from './application/use-cases/get-admission-stats/get-admission-stats.use-case.js'
import { GetApplicationByIdUseCase } from './application/use-cases/get-application-by-id/get-application-by-id.use-case.js'
import { GetApplicationsUseCase } from './application/use-cases/get-applications/get-applications.use-case.js'
import { RejectApplicationUseCase } from './application/use-cases/reject-application/reject-application.use-case.js'
import { RequestRevisionUseCase } from './application/use-cases/request-revision/request-revision.use-case.js'
import { VerifyApplicationUseCase } from './application/use-cases/verify-application/verify-application.use-case.js'

@Module({
  imports: [
    AuthModule,
    UserModule,
    ApplicantModule,
    DocumentModule,
    PaymentModule,
    NotificationModule,
    IntegrationModule,
  ],
  controllers: [AdmissionAdminController, AdmissionAdminRegistrationController],
  providers: [
    {
      provide: IAdmissionApplicationRepository,
      useClass: PrismaAdmissionApplicationRepository,
    },
    GetApplicationsUseCase,
    GetApplicationByIdUseCase,
    RequestRevisionUseCase,
    VerifyApplicationUseCase,
    AcceptApplicationUseCase,
    RejectApplicationUseCase,
    EnrollApplicantUseCase,
    GetAdmissionStatsUseCase,
  ],
  exports: [
    IAdmissionApplicationRepository,
    AcceptApplicationUseCase,
    EnrollApplicantUseCase,
    GetAdmissionStatsUseCase,
    GetApplicationByIdUseCase,
    GetApplicationsUseCase,
    RejectApplicationUseCase,
    RequestRevisionUseCase,
    VerifyApplicationUseCase,
  ],
})
export class ApplicationModule {}
