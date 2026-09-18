import { Module } from '@nestjs/common'
import { LocationController } from './presentation/http/location.controller.js'
import { PrismaLocationRepository } from './infrastructure/persistence/prisma/prisma-location.repository.js'
import { ILocationRepository } from './domain/repositories/location.repository.js'
import { CreateLocationUseCase } from './application/use-cases/create-location/create-location.use-case.js'
import { DeleteLocationUseCase } from './application/use-cases/delete-location/delete-location.use-case.js'
import { GetLocationsUseCase } from './application/use-cases/get-locations/get-locations.use-case.js'
import { UpdateLocationUseCase } from './application/use-cases/update-location/update-location.use-case.js'

@Module({
  controllers: [LocationController],
  providers: [
    { provide: ILocationRepository, useClass: PrismaLocationRepository },
    GetLocationsUseCase,
    CreateLocationUseCase,
    UpdateLocationUseCase,
    DeleteLocationUseCase,
  ],
  exports: [ILocationRepository],
})
export class LocationModule {}
