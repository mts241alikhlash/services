import { Module } from '@nestjs/common'
import { AuthModule } from '../../platform/auth/auth.module.js'
import { GetAdmissionFileUseCase } from './application/use-cases/get-admission-file/get-admission-file.use-case.js'
import { IAdmissionFileContent } from './domain/repositories/admission-file-content.port.js'
import { IAdmissionFileRepository } from './domain/repositories/admission-file.repository.js'
import { PrismaAdmissionFileRepository } from './infrastructure/persistence/prisma/prisma-admission-file.repository.js'
import { StorageFileContent } from './infrastructure/storage/storage-file-content.js'
import { AdmissionFileController } from './presentation/http/admission-file.controller.js'

@Module({
  imports: [AuthModule],
  controllers: [AdmissionFileController],
  providers: [
    {
      provide: IAdmissionFileRepository,
      useClass: PrismaAdmissionFileRepository,
    },
    { provide: IAdmissionFileContent, useClass: StorageFileContent },
    GetAdmissionFileUseCase,
  ],
})
export class FileModule {}
