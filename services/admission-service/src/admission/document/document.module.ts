import { Module } from '@nestjs/common'
import { ApplicantModule } from '../applicant/applicant.module.js'
import { NotificationModule } from '../notification/notification.module.js'
import { AdmissionDocumentNotificationAdapter } from './infrastructure/notification/admission-document-notification.adapter.js'
import { PrismaAdmissionDocumentRepository } from './infrastructure/persistence/prisma/prisma-admission-document.repository.js'
import { AdmissionFileStorage } from './infrastructure/storage/admission-file-storage.js'
import { IAdmissionFileStorage } from './domain/repositories/admission-file-storage.js'
import { IAdmissionDocumentNotificationPort } from './domain/repositories/admission-document-notification.port.js'
import { IAdmissionDocumentRepository } from './domain/repositories/admission-document-repository.js'
import { UploadAdmissionDocumentUseCase } from './application/use-cases/upload-admission-document/upload-admission-document.use-case.js'
import { VerifyDocumentUseCase } from './application/use-cases/verify-document/verify-document.use-case.js'

@Module({
  imports: [ApplicantModule, NotificationModule],
  providers: [
    {
      provide: IAdmissionDocumentRepository,
      useClass: PrismaAdmissionDocumentRepository,
    },
    {
      provide: IAdmissionFileStorage,
      useClass: AdmissionFileStorage,
    },
    {
      provide: IAdmissionDocumentNotificationPort,
      useClass: AdmissionDocumentNotificationAdapter,
    },
    UploadAdmissionDocumentUseCase,
    VerifyDocumentUseCase,
  ],
  exports: [
    IAdmissionDocumentRepository,
    IAdmissionFileStorage,
    UploadAdmissionDocumentUseCase,
    VerifyDocumentUseCase,
  ],
})
export class DocumentModule {}
