import { Module } from '@nestjs/common'
import { AuthModule } from '../../platform/auth/auth.module.js'
import { AdmissionDocumentTypeController } from './presentation/http/admission-document-type.controller.js'
import { PrismaAdmissionDocumentTypeRepository } from './infrastructure/persistence/prisma/prisma-admission-document-type.repository.js'
import { IAdmissionDocumentTypeRepository } from './domain/repositories/admission-document-type-repository.js'
import { GetDocumentTypesUseCase } from './application/use-cases/get-document-types/get-document-types.use-case.js'
import { SaveDocumentTypeUseCase } from './application/use-cases/save-document-type/save-document-type.use-case.js'
import { ReorderDocumentTypesUseCase } from './application/use-cases/reorder-document-types/reorder-document-types.use-case.js'
import { DeleteDocumentTypeUseCase } from './application/use-cases/delete-document-type/delete-document-type.use-case.js'

@Module({
  imports: [AuthModule],
  controllers: [AdmissionDocumentTypeController],
  providers: [
    {
      provide: IAdmissionDocumentTypeRepository,
      useClass: PrismaAdmissionDocumentTypeRepository,
    },
    GetDocumentTypesUseCase,
    SaveDocumentTypeUseCase,
    ReorderDocumentTypesUseCase,
    DeleteDocumentTypeUseCase,
  ],
})
export class DocumentTypeModule {}
