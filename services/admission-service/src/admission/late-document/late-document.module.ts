import { Module } from '@nestjs/common'
import { AuthModule } from '../../platform/auth/auth.module.js'
import { ReferenceLookupModule } from '../../platform/reference-lookup/reference-lookup.module.js'
import { DocumentModule } from '../document/document.module.js'
import { DecideLateDocumentUseCase } from './application/use-cases/decide-late-document/decide-late-document.use-case.js'
import { GetLateDocumentsUseCase } from './application/use-cases/get-late-documents/get-late-documents.use-case.js'
import { UploadLateDocumentUseCase } from './application/use-cases/upload-late-document/upload-late-document.use-case.js'
import { ILateDocumentRepository } from './domain/repositories/late-document.repository.js'
import { PrismaLateDocumentRepository } from './infrastructure/persistence/prisma/prisma-late-document.repository.js'
import { AdmissionLateDocumentController } from './presentation/http/admission-late-document.controller.js'

@Module({
  imports: [AuthModule, DocumentModule, ReferenceLookupModule],
  controllers: [AdmissionLateDocumentController],
  providers: [
    {
      provide: ILateDocumentRepository,
      useClass: PrismaLateDocumentRepository,
    },
    GetLateDocumentsUseCase,
    UploadLateDocumentUseCase,
    DecideLateDocumentUseCase,
  ],
})
export class LateDocumentModule {}
