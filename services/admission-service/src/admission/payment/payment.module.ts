import { Module } from '@nestjs/common'
import { AuthModule } from '../../platform/auth/auth.module.js'
import { ApplicantModule } from '../applicant/applicant.module.js'
import { DocumentModule } from '../document/document.module.js'
import { NotificationModule } from '../notification/notification.module.js'
import { AdmissionPaymentNotificationAdapter } from './infrastructure/notification/admission-payment-notification.adapter.js'
import { PrismaAdmissionPaymentRepository } from './infrastructure/persistence/prisma/prisma-admission-payment.repository.js'
import { IAdmissionPaymentNotificationPort } from './domain/repositories/admission-payment-notification.port.js'
import { IAdmissionPaymentRepository } from './domain/repositories/admission-payment-repository.js'
import { UploadPaymentProofUseCase } from './application/use-cases/upload-payment-proof/upload-payment-proof.use-case.js'
import { VerifyPaymentUseCase } from './application/use-cases/verify-payment/verify-payment.use-case.js'
import { AdmissionPaymentAdminController } from './presentation/http/admission-payment-admin.controller.js'
import { IAdmissionPaymentQueueRepository } from './domain/repositories/admission-payment-queue-repository.js'
import { PrismaAdmissionPaymentQueueRepository } from './infrastructure/persistence/prisma/prisma-admission-payment-queue.repository.js'
import { AddPaymentUseCase } from './application/use-cases/add-payment/add-payment.use-case.js'
import { CancelPaymentUseCase } from './application/use-cases/cancel-payment/cancel-payment.use-case.js'
import { GetEligibleApplicationsUseCase } from './application/use-cases/get-eligible-applications/get-eligible-applications.use-case.js'
import { GetPaymentQueueUseCase } from './application/use-cases/get-payment-queue/get-payment-queue.use-case.js'
import { BankAccountModule } from '../bank-account/bank-account.module.js'

@Module({
  imports: [
    AuthModule,
    ApplicantModule,
    DocumentModule,
    NotificationModule,
    BankAccountModule,
  ],
  controllers: [AdmissionPaymentAdminController],
  providers: [
    {
      provide: IAdmissionPaymentRepository,
      useClass: PrismaAdmissionPaymentRepository,
    },
    {
      provide: IAdmissionPaymentQueueRepository,
      useClass: PrismaAdmissionPaymentQueueRepository,
    },
    {
      provide: IAdmissionPaymentNotificationPort,
      useClass: AdmissionPaymentNotificationAdapter,
    },
    UploadPaymentProofUseCase,
    VerifyPaymentUseCase,
    CancelPaymentUseCase,
    AddPaymentUseCase,
    GetPaymentQueueUseCase,
    GetEligibleApplicationsUseCase,
  ],
  exports: [UploadPaymentProofUseCase, VerifyPaymentUseCase],
})
export class PaymentModule {}
