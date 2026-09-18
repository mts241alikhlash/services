import 'reflect-metadata'
import { Test } from '@nestjs/testing'
import { PrismaService } from '../core/database/prisma.service.js'
import { PrismaModule } from '../core/database/prisma.module.js'
import { ApprovalModule } from './approval/approval.module.js'
import { PrismaApprovalRepository } from './approval/infrastructure/persistence/prisma/prisma-approval.repository.js'
import {
  IApprovalCapabilityPort,
  IApprovalRepository,
} from './approval/index.js'
import { AssetModule } from './asset/asset.module.js'
import { PrismaAssetRepository } from './asset/infrastructure/persistence/prisma/prisma-asset.repository.js'
import { PrismaAssetUnitRepository } from './asset/infrastructure/persistence/prisma/prisma-asset-unit.repository.js'
import {
  IAssetRepository,
  IAssetCategoryLookupPort,
  IAssetConditionLookupPort,
  IAssetFundingSourceLookupPort,
  IAssetLocationLookupPort,
  IAssetStatusLookupPort,
  IAssetUnitDetailsCapabilityPort,
  IAssetUnitCapabilityPort,
  IAssetUnitMutationPort,
  IAssetUnitRepository,
} from './asset/index.js'
import { CirculationModule } from './circulation/circulation.module.js'
import { PrismaCirculationRepository } from './circulation/infrastructure/persistence/prisma/prisma-circulation.repository.js'
import {
  IHistoryCapabilityPort,
  IHistoryRepository,
  ILoanCapabilityPort,
  ILoanItemCapabilityPort,
  ILoanRepository,
  ITransactionTypeCapabilityPort,
  ITransactionTypeRepository,
} from './circulation/index.js'
import { ICategoryRepository } from './reference-data/category/index.js'
import { PrismaCategoryRepository } from './reference-data/category/infrastructure/persistence/prisma/prisma-category.repository.js'
import { IConditionRepository } from './reference-data/condition/index.js'
import { PrismaConditionRepository } from './reference-data/condition/infrastructure/persistence/prisma/prisma-condition.repository.js'
import { IFundingSourceRepository } from './reference-data/funding-source/index.js'
import { PrismaFundingSourceRepository } from './reference-data/funding-source/infrastructure/persistence/prisma/prisma-funding-source.repository.js'
import { ILocationRepository } from './reference-data/location/index.js'
import { PrismaLocationRepository } from './reference-data/location/infrastructure/persistence/prisma/prisma-location.repository.js'
import {
  IStatusLookupPort,
  IStatusRepository,
} from './reference-data/status/index.js'
import { PrismaStatusRepository } from './reference-data/status/infrastructure/persistence/prisma/prisma-status.repository.js'
import { InventoryModule } from './inventory.module.js'

describe('InventoryModule', () => {
  async function moduleRef() {
    return Test.createTestingModule({
      imports: [PrismaModule, InventoryModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile()
  }

  it('resolves every public repository port to its owning Prisma adapter', async () => {
    const module = await moduleRef()

    expect(module.get(ICategoryRepository)).toBeInstanceOf(
      PrismaCategoryRepository,
    )
    expect(module.get(IConditionRepository)).toBeInstanceOf(
      PrismaConditionRepository,
    )
    expect(module.get(IFundingSourceRepository)).toBeInstanceOf(
      PrismaFundingSourceRepository,
    )
    expect(module.get(ILocationRepository)).toBeInstanceOf(
      PrismaLocationRepository,
    )
    expect(module.get(IStatusRepository)).toBeInstanceOf(PrismaStatusRepository)
    expect(module.get(IStatusLookupPort)).toBe(module.get(IStatusRepository))

    expect(module.get(IAssetRepository)).toBeInstanceOf(PrismaAssetRepository)
    expect(module.get(IAssetUnitRepository)).toBeInstanceOf(
      PrismaAssetUnitRepository,
    )
    expect(module.get(IAssetUnitCapabilityPort)).toBe(
      module.get(IAssetUnitRepository),
    )
    expect(module.get(IAssetUnitMutationPort)).toBe(
      module.get(IAssetUnitRepository),
    )

    expect(module.get(ILoanRepository)).toBeInstanceOf(
      PrismaCirculationRepository,
    )
    expect(module.get(IHistoryRepository)).toBe(module.get(ILoanRepository))
    expect(module.get(ITransactionTypeRepository)).toBe(
      module.get(ILoanRepository),
    )
    expect(module.get(ILoanCapabilityPort)).toBe(module.get(ILoanRepository))
    expect(module.get(ILoanItemCapabilityPort)).toBe(
      module.get(ILoanRepository),
    )
    expect(module.get(IHistoryCapabilityPort)).toBe(module.get(ILoanRepository))
    expect(module.get(ITransactionTypeCapabilityPort)).toBe(
      module.get(ILoanRepository),
    )

    expect(module.get(IApprovalRepository)).toBeInstanceOf(
      PrismaApprovalRepository,
    )
    expect(module.get(IApprovalCapabilityPort)).toBe(
      module.get(IApprovalRepository),
    )

    await module.close()
  })

  it('wires cross-module capabilities through public ports', async () => {
    const module = await moduleRef()

    expect(module.get(IAssetUnitCapabilityPort)).toBeInstanceOf(
      PrismaAssetUnitRepository,
    )
    expect(module.get(IAssetUnitMutationPort)).toBe(
      module.get(IAssetUnitCapabilityPort),
    )
    expect(module.get(IStatusLookupPort)).toBeInstanceOf(PrismaStatusRepository)
    expect(module.get(IApprovalCapabilityPort)).toBeInstanceOf(
      PrismaApprovalRepository,
    )
    expect(module.get(ILoanCapabilityPort)).toBeInstanceOf(
      PrismaCirculationRepository,
    )
    expect(module.get(IHistoryCapabilityPort)).toBe(
      module.get(ILoanCapabilityPort),
    )

    await module.close()
  })

  it('does not reference foreign concrete adapters in repositories', () => {
    expect(
      Reflect.getMetadata('design:paramtypes', PrismaAssetRepository),
    ).toEqual([
      PrismaService,
      IAssetCategoryLookupPort,
      IAssetFundingSourceLookupPort,
      IAssetConditionLookupPort,
      IAssetStatusLookupPort,
      IAssetLocationLookupPort,
    ])
    expect(
      Reflect.getMetadata('design:paramtypes', PrismaAssetUnitRepository),
    ).toEqual([
      PrismaService,
      IAssetRepository,
      IAssetConditionLookupPort,
      IAssetStatusLookupPort,
      IAssetLocationLookupPort,
    ])
    expect(
      Reflect.getMetadata('design:paramtypes', PrismaCirculationRepository),
    ).toEqual([PrismaService, IAssetUnitDetailsCapabilityPort])
    expect(
      Reflect.getMetadata('design:paramtypes', PrismaApprovalRepository),
    ).toEqual([PrismaService])
  })
})
