import { Module } from '@nestjs/common'
import { PositionController } from './presentation/http/position.controller.js'
import { PrismaPositionRepository } from './infrastructure/persistence/prisma/prisma-position.repository.js'
import { IPositionRepository } from './domain/repositories/position.repository.js'
import { CreatePositionUseCase } from './application/use-cases/create-position/create-position.use-case.js'
import { DeletePositionUseCase } from './application/use-cases/delete-position/delete-position.use-case.js'
import { GetPositionByIdUseCase } from './application/use-cases/get-position-by-id/get-position-by-id.use-case.js'
import { GetPositionsUseCase } from './application/use-cases/get-positions/get-positions.use-case.js'
import { UpdatePositionUseCase } from './application/use-cases/update-position/update-position.use-case.js'

@Module({
  controllers: [PositionController],
  providers: [
    { provide: IPositionRepository, useClass: PrismaPositionRepository },
    GetPositionsUseCase,
    GetPositionByIdUseCase,
    CreatePositionUseCase,
    UpdatePositionUseCase,
    DeletePositionUseCase,
  ],
  exports: [IPositionRepository],
})
export class PositionModule {}
