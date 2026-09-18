import { Module } from '@nestjs/common'
import { ApplicantModule } from '../applicant/applicant.module.js'
import { DocumentModule } from '../document/document.module.js'
import { NotificationModule } from '../notification/notification.module.js'
import { AdmissionPaymentNotificationAdapter } from './infrastructure/notification/admission-payment-notification.adapter.js'
import { PrismaAdmissionPaymentRepository } from './infrastructure/persistence/prisma/prisma-admission-payment.repository.js'
import { IAdmissionPaymentNotificationPort } from './domain/repositories/admission-payment-notification.port.js'
import { IAdmissionPaymentRepository } from './domain/repositories/admission-payment-repository.js'
import { UploadPaymentProofUseCase } from './application/use-cases/upload-payment-proof/upload-payment-proof.use-case.js'
import { VerifyPaymentUseCase } from './application/use-cases/verify-payment/verify-payment.use-case.js'

@Module({
  imports: [ApplicantModule, DocumentModule, NotificationModule],
  providers: [
    {
      provide: IAdmissionPaymentRepository,
      useClass: PrismaAdmissionPaymentRepository,
    },
    {
      provide: IAdmissionPaymentNotificationPort,
      useClass: AdmissionPaymentNotificationAdapter,
    },
    UploadPaymentProofUseCase,
    VerifyPaymentUseCase,
  ],
  exports: [UploadPaymentProofUseCase, VerifyPaymentUseCase],
})
export class PaymentModule {}
