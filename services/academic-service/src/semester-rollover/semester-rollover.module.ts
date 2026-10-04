import { Module } from '@nestjs/common'
import { SemesterRolloverController } from './presentation/http/semester-rollover.controller.js'
import { PrismaRolloverRepository } from './infrastructure/persistence/prisma/prisma-rollover.repository.js'
import { RolloverSemesterUseCase } from './application/use-cases/rollover-semester/rollover-semester.use-case.js'
import { IRolloverRepository } from './domain/repositories/rollover.repository.js'

@Module({
  controllers: [SemesterRolloverController],
  providers: [
    { provide: IRolloverRepository, useClass: PrismaRolloverRepository },
    RolloverSemesterUseCase,
  ],
  exports: [IRolloverRepository],
})
export class SemesterRolloverModule {}
