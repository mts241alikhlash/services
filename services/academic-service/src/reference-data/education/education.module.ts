import { Module } from '@nestjs/common'
import { IEducationRepository } from './domain/repositories/education.repository.js'
import { PrismaEducationRepository } from './infrastructure/persistence/prisma/prisma-education.repository.js'
import { GetEducationsUseCase } from './application/use-cases/get-educations/get-educations.use-case.js'
import { EducationController } from './presentation/http/education.controller.js'
import { EducationInternalController } from './presentation/http/education-internal.controller.js'

@Module({
  controllers: [EducationInternalController, EducationController],
  providers: [
    { provide: IEducationRepository, useClass: PrismaEducationRepository },
    GetEducationsUseCase,
  ],
  exports: [IEducationRepository],
})
export class EducationModule {}
