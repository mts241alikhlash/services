import { Module } from '@nestjs/common'
import { OccupationController } from './presentation/http/occupation.controller.js'
import { PrismaOccupationRepository } from './infrastructure/persistence/prisma/prisma-occupation.repository.js'
import { IOccupationRepository } from './domain/repositories/occupation.repository.js'
import { CreateOccupationUseCase } from './application/use-cases/create-occupation/create-occupation.use-case.js'
import { DeleteOccupationUseCase } from './application/use-cases/delete-occupation/delete-occupation.use-case.js'
import { GetOccupationByIdUseCase } from './application/use-cases/get-occupation-by-id/get-occupation-by-id.use-case.js'
import { GetOccupationsUseCase } from './application/use-cases/get-occupations/get-occupations.use-case.js'
import { UpdateOccupationUseCase } from './application/use-cases/update-occupation/update-occupation.use-case.js'
import { OccupationInternalController } from './presentation/http/occupation-internal.controller.js'

@Module({
  controllers: [OccupationInternalController, OccupationController],
  providers: [
    { provide: IOccupationRepository, useClass: PrismaOccupationRepository },
    GetOccupationsUseCase,
    GetOccupationByIdUseCase,
    CreateOccupationUseCase,
    UpdateOccupationUseCase,
    DeleteOccupationUseCase,
  ],
  exports: [IOccupationRepository],
})
export class OccupationModule {}
