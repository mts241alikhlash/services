import { Module } from '@nestjs/common'
import { AuthModule } from '../../platform/auth/auth.module.js'
import { DeleteDownloadUseCase } from './application/use-cases/delete-download/delete-download.use-case.js'
import { GetDownloadFileUseCase } from './application/use-cases/get-download-file/get-download-file.use-case.js'
import { GetDownloadsUseCase } from './application/use-cases/get-downloads/get-downloads.use-case.js'
import { ReorderDownloadsUseCase } from './application/use-cases/reorder-downloads/reorder-downloads.use-case.js'
import { SaveDownloadUseCase } from './application/use-cases/save-download/save-download.use-case.js'
import { IAdmissionDownloadRepository } from './domain/repositories/admission-download-repository.js'
import { IAdmissionDownloadStorage } from './domain/repositories/admission-download-storage.port.js'
import { PrismaAdmissionDownloadRepository } from './infrastructure/persistence/prisma/prisma-admission-download.repository.js'
import { StorageDownloadStorage } from './infrastructure/storage/storage-download-storage.js'
import { AdmissionDownloadPublicController } from './presentation/http/admission-download-public.controller.js'
import { AdmissionDownloadController } from './presentation/http/admission-download.controller.js'

@Module({
  imports: [AuthModule],
  controllers: [AdmissionDownloadController, AdmissionDownloadPublicController],
  providers: [
    {
      provide: IAdmissionDownloadRepository,
      useClass: PrismaAdmissionDownloadRepository,
    },
    { provide: IAdmissionDownloadStorage, useClass: StorageDownloadStorage },
    GetDownloadsUseCase,
    SaveDownloadUseCase,
    ReorderDownloadsUseCase,
    DeleteDownloadUseCase,
    GetDownloadFileUseCase,
  ],
})
export class DownloadModule {}
