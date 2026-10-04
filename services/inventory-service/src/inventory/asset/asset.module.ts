import { Module } from '@nestjs/common'
import { AssetController } from './presentation/http/asset.controller.js'
import { AssetUnitController } from './presentation/http/asset-unit.controller.js'
import { PrismaAssetRepository } from './infrastructure/persistence/prisma/prisma-asset.repository.js'
import { PrismaAssetUnitRepository } from './infrastructure/persistence/prisma/prisma-asset-unit.repository.js'
import { IAssetRepository } from './domain/repositories/asset.repository.js'
import {
  IAssetUnitCapabilityPort,
  IAssetUnitDetailsCapabilityPort,
  IAssetUnitMutationPort,
  IAssetUnitRepository,
} from './domain/repositories/asset-unit.repository.js'
import { CreateAssetUseCase } from './application/use-cases/create-asset/create-asset.use-case.js'
import { DeleteAssetUseCase } from './application/use-cases/delete-asset/delete-asset.use-case.js'
import { GetAssetByIdUseCase } from './application/use-cases/get-asset-by-id/get-asset-by-id.use-case.js'
import { GetAssetsUseCase } from './application/use-cases/get-assets/get-assets.use-case.js'
import { UpdateAssetUseCase } from './application/use-cases/update-asset/update-asset.use-case.js'
import { AddUnitsUseCase } from './application/use-cases/add-units/add-units.use-case.js'
import { GetAssetUnitsUseCase } from './application/use-cases/get-asset-units/get-asset-units.use-case.js'
import { UpdateUnitUseCase } from './application/use-cases/update-unit/update-unit.use-case.js'
import { DeleteUnitUseCase } from './application/use-cases/delete-unit/delete-unit.use-case.js'
import { CategoryModule } from '../reference-data/category/category.module.js'
import { ConditionModule } from '../reference-data/condition/condition.module.js'
import { FundingSourceModule } from '../reference-data/funding-source/funding-source.module.js'
import { LocationModule } from '../reference-data/location/location.module.js'
import { StatusModule } from '../reference-data/status/status.module.js'
import { ICategoryRepository } from '../reference-data/category/index.js'
import { IFundingSourceRepository } from '../reference-data/funding-source/index.js'
import { IConditionRepository } from '../reference-data/condition/index.js'
import { IStatusRepository } from '../reference-data/status/index.js'
import { ILocationRepository } from '../reference-data/location/index.js'
import {
  IAssetCategoryLookupPort,
  IAssetFundingSourceLookupPort,
  IAssetConditionLookupPort,
  IAssetStatusLookupPort,
  IAssetLocationLookupPort,
} from './index.js'

@Module({
  imports: [
    CategoryModule,
    ConditionModule,
    FundingSourceModule,
    LocationModule,
    StatusModule,
  ],
  controllers: [AssetController, AssetUnitController],
  providers: [
    { provide: IAssetRepository, useClass: PrismaAssetRepository },
    {
      provide: IAssetUnitRepository,
      useClass: PrismaAssetUnitRepository,
    },
    { provide: IAssetUnitCapabilityPort, useExisting: IAssetUnitRepository },
    {
      provide: IAssetUnitDetailsCapabilityPort,
      useExisting: IAssetUnitRepository,
    },
    { provide: IAssetUnitMutationPort, useExisting: IAssetUnitRepository },
    { provide: IAssetCategoryLookupPort, useExisting: ICategoryRepository },
    {
      provide: IAssetFundingSourceLookupPort,
      useExisting: IFundingSourceRepository,
    },
    { provide: IAssetConditionLookupPort, useExisting: IConditionRepository },
    { provide: IAssetStatusLookupPort, useExisting: IStatusRepository },
    { provide: IAssetLocationLookupPort, useExisting: ILocationRepository },
    GetAssetsUseCase,
    GetAssetByIdUseCase,
    CreateAssetUseCase,
    UpdateAssetUseCase,
    DeleteAssetUseCase,
    AddUnitsUseCase,
    GetAssetUnitsUseCase,
    UpdateUnitUseCase,
    DeleteUnitUseCase,
  ],
  exports: [
    IAssetRepository,
    IAssetUnitRepository,
    IAssetUnitCapabilityPort,
    IAssetUnitDetailsCapabilityPort,
    IAssetUnitMutationPort,
    IAssetStatusLookupPort,
  ],
})
export class AssetModule {}
