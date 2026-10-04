import { Test } from '@nestjs/testing'
import { PrismaService } from '../../core/database/prisma.service.js'
import { PrismaModule } from '../../core/database/prisma.module.js'
import { IAssetRepository, IAssetUnitRepository } from './index.js'
import { AssetModule } from './asset.module.js'
import { PrismaAssetRepository } from './infrastructure/persistence/prisma/prisma-asset.repository.js'
import { PrismaAssetUnitRepository } from './infrastructure/persistence/prisma/prisma-asset-unit.repository.js'
import { AssetController } from './presentation/http/asset.controller.js'
import { AssetUnitController } from './presentation/http/asset-unit.controller.js'
import { AddUnitsUseCase } from './application/use-cases/add-units/add-units.use-case.js'
import { CreateAssetUseCase } from './application/use-cases/create-asset/create-asset.use-case.js'
import { DeleteAssetUseCase } from './application/use-cases/delete-asset/delete-asset.use-case.js'
import { DeleteUnitUseCase } from './application/use-cases/delete-unit/delete-unit.use-case.js'
import { GetAssetByIdUseCase } from './application/use-cases/get-asset-by-id/get-asset-by-id.use-case.js'
import { GetAssetUnitsUseCase } from './application/use-cases/get-asset-units/get-asset-units.use-case.js'
import { GetAssetsUseCase } from './application/use-cases/get-assets/get-assets.use-case.js'
import { UpdateAssetUseCase } from './application/use-cases/update-asset/update-asset.use-case.js'
import { UpdateUnitUseCase } from './application/use-cases/update-unit/update-unit.use-case.js'

describe('AssetModule', () => {
  it('resolves each repository port to its Prisma adapter', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, AssetModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile()

    expect(moduleRef.get(IAssetRepository)).toBeInstanceOf(
      PrismaAssetRepository,
    )
    expect(moduleRef.get(IAssetUnitRepository)).toBeInstanceOf(
      PrismaAssetUnitRepository,
    )
    await moduleRef.close()
  })

  it('registers all moved use cases and controllers', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, AssetModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile()

    for (const provider of [
      AddUnitsUseCase,
      CreateAssetUseCase,
      DeleteAssetUseCase,
      DeleteUnitUseCase,
      GetAssetByIdUseCase,
      GetAssetUnitsUseCase,
      GetAssetsUseCase,
      UpdateAssetUseCase,
      UpdateUnitUseCase,
      AssetController,
      AssetUnitController,
    ]) {
      expect(moduleRef.get(provider)).toBeInstanceOf(provider)
    }
    await moduleRef.close()
  })
})
