import { PrismaAssetUnitRepository } from './prisma-asset-unit.repository.js'
import type { IAssetRepository } from '../../../domain/repositories/asset.repository.js'
import type { IAssetConditionLookupPort } from '../../../domain/repositories/condition-lookup.port.js'
import type { IAssetLocationLookupPort } from '../../../domain/repositories/location-lookup.port.js'
import type { IAssetStatusLookupPort } from '../../../domain/repositories/status-lookup.port.js'
import type { PrismaService } from '../../../../../core/database/prisma.service.js'
import type { AssetUnitQueryInput } from '../../../domain/repositories/asset-unit.repository.js'

describe('lendable asset units', () => {
  function repositoryWithSpies() {
    const findMany = jest.fn().mockResolvedValue([])
    const count = jest.fn().mockResolvedValue(1)
    const assetFindReferenceById = jest.fn().mockResolvedValue(null)
    const conditionFindById = jest.fn().mockResolvedValue(null)
    const statusFindById = jest.fn().mockResolvedValue(null)
    const findIdsAllowingTransactions = jest
      .fn()
      .mockResolvedValue(['status-1'])
    const locationFindById = jest.fn().mockResolvedValue(null)
    const prisma = {
      inventoryAssetUnit: { findMany, count },
    } as unknown as PrismaService

    return {
      repository: new PrismaAssetUnitRepository(
        prisma,
        {
          findReferenceById: assetFindReferenceById,
        } as unknown as IAssetRepository,
        { findById: conditionFindById },
        {
          findById: statusFindById,
          findIdsAllowingTransactions,
        },
        { findById: locationFindById },
      ),
      findMany,
      count,
      assetFindReferenceById,
      statusFindById,
      findIdsAllowingTransactions,
    }
  }

  it('keeps only units whose status capability permits transactions', async () => {
    const unit = {
      id: 'unit-1',
      assetId: 'asset-1',
      unitNumber: 'UNIT-1',
      conditionId: 'condition-1',
      statusId: 'status-1',
      locationId: 'location-1',
      currentBookValue: { toString: () => '1' },
      barcode: null,
      custodianId: null,
      notes: null,
      deletedAt: null,
    }
    const {
      repository,
      findMany,
      statusFindById,
      findIdsAllowingTransactions,
    } = repositoryWithSpies()
    findMany.mockResolvedValue([unit])
    statusFindById.mockResolvedValue({
      id: 'status-1',
      code: 'AVAILABLE',
      name: 'Available',
      allowTransactions: true,
    })

    await expect(
      repository.findAll({ page: 1, limit: 50, lendable: true }),
    ).resolves.toMatchObject({ total: 1, data: [{ id: 'unit-1' }] })

    expect(findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        statusId: { in: ['status-1'] },
      },
      skip: 0,
      take: 50,
      orderBy: [{ asset: { name: 'asc' } }, { unitNumber: 'asc' }],
    })
    expect(findIdsAllowingTransactions).toHaveBeenCalled()
  })

  it('lists everything when lendable is not asked for', async () => {
    const { repository, findMany } = repositoryWithSpies()

    await repository.findAll({ page: 1, limit: 50 })

    expect(findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      skip: 0,
      take: 50,
      orderBy: [{ asset: { name: 'asc' } }, { unitNumber: 'asc' }],
    })
  })

  it('lists everything when lendable is explicitly false', async () => {
    const { repository, findMany } = repositoryWithSpies()

    await repository.findAll({ page: 1, limit: 50, lendable: false })

    expect(findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      skip: 0,
      take: 50,
      orderBy: [{ asset: { name: 'asc' } }, { unitNumber: 'asc' }],
    })
  })

  it('pushes search into unit and asset-name predicates', async () => {
    const { repository, findMany, count, assetFindReferenceById } =
      repositoryWithSpies()
    assetFindReferenceById.mockResolvedValue({
      id: 'asset-1',
      assetNumber: 'ASSET-1',
      name: 'Laptop',
      category: null,
    })
    findMany.mockResolvedValue([
      {
        id: 'unit-1',
        assetId: 'asset-1',
        unitNumber: 'UNIT-1',
        conditionId: 'condition-1',
        statusId: 'status-1',
        locationId: 'location-1',
        currentBookValue: { toString: () => '1' },
        barcode: null,
        custodianId: null,
        notes: null,
        deletedAt: null,
      },
    ])

    await expect(
      repository.findAll({ page: 1, limit: 50, search: 'laptop' }),
    ).resolves.toMatchObject({ total: 1, data: [{ id: 'unit-1' }] })

    expect(findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        OR: [
          { unitNumber: { contains: 'laptop', mode: 'insensitive' } },
          { asset: { name: { contains: 'laptop', mode: 'insensitive' } } },
        ],
      },
      skip: 0,
      take: 50,
      orderBy: [{ asset: { name: 'asc' } }, { unitNumber: 'asc' }],
    })
    expect(count).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        OR: [
          { unitNumber: { contains: 'laptop', mode: 'insensitive' } },
          { asset: { name: { contains: 'laptop', mode: 'insensitive' } } },
        ],
      },
    })
  })

  it('never returns a soft-deleted unit', async () => {
    const { repository, findMany } = repositoryWithSpies()

    await repository.findAll({ page: 1, limit: 50, lendable: true })

    expect(findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        statusId: { in: ['status-1'] },
      },
      skip: 0,
      take: 50,
      orderBy: [{ asset: { name: 'asc' } }, { unitNumber: 'asc' }],
    })
  })

  describe('the repository query input', () => {
    function query(value: boolean): AssetUnitQueryInput {
      return { lendable: value }
    }

    it('accepts lendable true', () => {
      expect(query(true).lendable).toBe(true)
    })

    it('accepts lendable false', () => {
      expect(query(false).lendable).toBe(false)
    })
  })
})
