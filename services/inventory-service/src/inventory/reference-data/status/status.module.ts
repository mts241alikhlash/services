import { Module } from '@nestjs/common'
import { StatusController } from './presentation/http/status.controller.js'
import { PrismaStatusRepository } from './infrastructure/persistence/prisma/prisma-status.repository.js'
import { IStatusRepository } from './domain/repositories/status.repository.js'
import { IStatusLookupPort } from './domain/repositories/status-lookup.port.js'
import { CreateStatusUseCase } from './application/use-cases/create-status/create-status.use-case.js'
import { DeleteStatusUseCase } from './application/use-cases/delete-status/delete-status.use-case.js'
import { GetStatusesUseCase } from './application/use-cases/get-statuses/get-statuses.use-case.js'
import { UpdateStatusUseCase } from './application/use-cases/update-status/update-status.use-case.js'

@Module({
  controllers: [StatusController],
  providers: [
    { provide: IStatusRepository, useClass: PrismaStatusRepository },
    { provide: IStatusLookupPort, useExisting: IStatusRepository },
    GetStatusesUseCase,
    CreateStatusUseCase,
    UpdateStatusUseCase,
    DeleteStatusUseCase,
  ],
  exports: [IStatusRepository, IStatusLookupPort],
})
export class StatusModule {}
