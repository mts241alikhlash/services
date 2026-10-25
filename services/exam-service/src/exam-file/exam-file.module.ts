import { Module } from '@nestjs/common'
import { GetExamFileUseCase } from './application/use-cases/get-exam-file/get-exam-file.use-case.js'
import { UploadExamFileUseCase } from './application/use-cases/upload-exam-file/upload-exam-file.use-case.js'
import { IExamFileRepository } from './domain/repositories/exam-file.repository.js'
import { IExamFileStorage } from './domain/repositories/exam-file-storage.js'
import { PrismaExamFileRepository } from './infrastructure/prisma-exam-file.repository.js'
import { StorageExamFileStorage } from './infrastructure/storage-exam-file-storage.js'
import { ExamFileController } from './presentation/http/exam-file.controller.js'

@Module({
  controllers: [ExamFileController],
  providers: [
    { provide: IExamFileRepository, useClass: PrismaExamFileRepository },
    { provide: IExamFileStorage, useClass: StorageExamFileStorage },
    UploadExamFileUseCase,
    GetExamFileUseCase,
  ],
  exports: [UploadExamFileUseCase],
})
export class ExamFileModule {}
