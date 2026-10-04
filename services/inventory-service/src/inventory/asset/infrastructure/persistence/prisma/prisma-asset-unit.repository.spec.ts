import type { PrismaService } from '../../../../../core/database/prisma.service.js'
import type { IAssetRepository } from '../../../domain/repositories/asset.repository.js'
import type { IAssetConditionLookupPort } from '../../../domain/repositories/condition-lookup.port.js'
import type { IAssetLocationLookupPort } from '../../../domain/repositories/location-lookup.port.js'
import type { IAssetStatusLookupPort } from '../../../domain/repositories/status-lookup.port.js'
import { PrismaAssetUnitRepository } from './prisma-asset-unit.repository.js'

describe('PrismaAssetUnitRepository', () => {
  const unit = {
    id: 'unit-1',
    assetId: 'asset-1',
    unitNumber: 'AST-COMP/2026/001-01',
    barcode: 'AST-COMP/2026/001-01',
    currentBookValue: { toString: () => '15000000' },
    conditionId: 'condition-1',
    statusId: 'status-1',
    locationId: 'location-1',
    custodianId: null,
    notes: null,
    deletedAt: null,
    condition: { id: 'condition-1', code: 'GOOD', name: 'Good' },
    status: { id: 'status-1', code: 'AVAILABLE', name: 'Available' },
    location: { id: 'location-1', code: 'LAB', name: 'Lab' },
    asset: {
      id: 'asset-1',
      assetNumber: 'AST-COMP/2026/001',
      name: 'Laptop',
      category: { id: 'category-1', code: 'COMP', name: 'Computer' },
    },
    legacyField: 'must not escape adapter',
  }

  function repositoryWithSpies() {
    const findMany = jest.fn().mockResolvedValue([unit])
    const count = jest.fn().mockResolvedValue(1)
    const findFirst = jest.fn().mockResolvedValue(unit)
    const create = jest.fn().mockResolvedValue(unit)
    const createMany = jest.fn().mockResolvedValue({ count: 1 })
    const update = jest.fn().mockResolvedValue(unit)
    const remove = jest.fn().mockResolvedValue(unit)
    const assetFindReferenceById = jest.fn().mockResolvedValue(unit.asset)
    const conditionFindById = jest.fn().mockResolvedValue(unit.condition)
    const statusFindById = jest.fn().mockResolvedValue({
      ...unit.status,
      allowTransactions: true,
    })
    const findIdsAllowingTransactions = jest
      .fn()
      .mockResolvedValue(['status-1'])
    const locationFindById = jest.fn().mockResolvedValue(unit.location)
    const prisma = {
      inventoryAssetUnit: {
        findMany,
        count,
        findFirst,
        create,
        createMany,
        update,
        delete: remove,
      },
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
      assetFindReferenceById,
      conditionFindById,
      statusFindById,
      findIdsAllowingTransactions,
      locationFindById,
      findMany,
      count,
      findFirst,
      create,
      createMany,
      update,
      remove,
      updateStatuses: update,
      updateCondition: update,
    }
  }

  it('maps list output explicitly and forwards pagination/search filters', async () => {
    const { repository, findMany, count } = repositoryWithSpies()

    await expect(repository.findAll({ page: 1, limit: 5 })).resolves.toEqual({
      data: [
        {
          id: unit.id,
          assetId: unit.assetId,
          unitNumber: unit.unitNumber,
          barcode: unit.barcode,
          currentBookValue: unit.currentBookValue,
          conditionId: unit.conditionId,
          statusId: unit.statusId,
          locationId: unit.locationId,
          custodianId: unit.custodianId,
          notes: unit.notes,
          deletedAt: unit.deletedAt,
          condition: unit.condition,
          status: unit.status,
          location: unit.location,
          asset: unit.asset,
        },
      ],
      total: 1,
      page: 1,
      limit: 5,
    })

    expect(findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      skip: 0,
      take: 5,
      orderBy: [{ asset: { name: 'asc' } }, { unitNumber: 'asc' }],
    })
    expect(count).toHaveBeenCalledWith({ where: { deletedAt: null } })
  })

  it('maps unit create and update inputs while converting book values', async () => {
    const { repository, create, update } = repositoryWithSpies()
    const createInput = {
      assetId: 'asset-1',
      unitNumber: unit.unitNumber,
      barcode: unit.barcode,
      currentBookValue: '15000000',
      conditionId: 'condition-1',
      statusId: 'status-1',
      locationId: 'location-1',
      custodianId: null,
      notes: null,
    }

    await repository.create(createInput)
    await repository.update('unit-1', {
      barcode: 'new-barcode',
      notes: 'Updated',
      custodianId: 'custodian-1',
      conditionId: 'condition-2',
      statusId: 'status-2',
      locationId: 'location-2',
    })

    expect(create).toHaveBeenCalledWith({
      data: { ...createInput, currentBookValue: 15000000 },
    })
    expect(update).toHaveBeenCalledWith({
      where: { id: 'unit-1' },
      data: {
        barcode: 'new-barcode',
        notes: 'Updated',
        custodianId: 'custodian-1',
        conditionId: 'condition-2',
        statusId: 'status-2',
        locationId: 'location-2',
      },
    })
  })

  it('propagates Prisma lookup errors and keeps lookup soft-delete filters', async () => {
    const { repository, findFirst } = repositoryWithSpies()
    const error = new Error('database unavailable')
    findFirst.mockRejectedValue(error)

    await expect(repository.findById('unit-1')).rejects.toBe(error)
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'unit-1', deletedAt: null },
    })
  })

  it('hydrates asset and reference projections through public capabilities', async () => {
    const {
      repository,
      assetFindReferenceById,
      conditionFindById,
      statusFindById,
      locationFindById,
    } = repositoryWithSpies()

    await expect(repository.findById('unit-1')).resolves.toMatchObject({
      asset: unit.asset,
      condition: unit.condition,
      status: unit.status,
      location: unit.location,
    })
    expect(assetFindReferenceById).toHaveBeenCalledWith('asset-1')
    expect(conditionFindById).toHaveBeenCalledWith('condition-1')
    expect(statusFindById).toHaveBeenCalledWith('status-1')
    expect(locationFindById).toHaveBeenCalledWith('location-1')
  })

  it('hydrates findByIds capability output through owning public ports', async () => {
    const {
      repository,
      assetFindReferenceById,
      conditionFindById,
      statusFindById,
      locationFindById,
      findMany,
    } = repositoryWithSpies()
    assetFindReferenceById.mockResolvedValue({
      ...unit.asset,
      name: 'Capability Laptop',
    })
    statusFindById.mockResolvedValue({
      ...unit.status,
      allowTransactions: false,
    })

    await expect(repository.findByIds(['unit-1'])).resolves.toEqual([
      {
        id: unit.id,
        unitNumber: unit.unitNumber,
        statusId: unit.statusId,
        asset: { name: 'Capability Laptop' },
        status: { allowTransactions: false },
      },
    ])
    expect(findMany).toHaveBeenCalledWith({
      where: { id: { in: ['unit-1'] }, deletedAt: null },
    })
    expect(assetFindReferenceById).toHaveBeenCalledWith('asset-1')
    expect(statusFindById).toHaveBeenCalledWith('status-1')
    expect(conditionFindById).not.toHaveBeenCalled()
    expect(locationFindById).not.toHaveBeenCalled()
  })

  it('returns live unit IDs with one owner query and preserves input order', async () => {
    const { repository, findMany } = repositoryWithSpies()
    findMany.mockResolvedValue([{ id: 'unit-2' }, { id: 'unit-1' }])

    await expect(
      repository.findLiveIds(['unit-1', 'unit-2', 'unit-1', 'missing']),
    ).resolves.toEqual(['unit-1', 'unit-2'])

    expect(findMany).toHaveBeenLastCalledWith({
      where: {
        id: { in: ['unit-1', 'unit-2', 'missing'] },
        deletedAt: null,
      },
      select: { id: true },
    })
  })

  it('does not query when no live unit IDs are requested', async () => {
    const { repository, findMany } = repositoryWithSpies()

    await expect(repository.findLiveIds([])).resolves.toEqual([])
    expect(findMany).not.toHaveBeenCalled()
  })

  it('returns all live unit IDs when no filter is supplied', async () => {
    const { repository, findMany } = repositoryWithSpies()
    findMany.mockResolvedValue([{ id: 'unit-2' }, { id: 'unit-1' }])

    await expect(repository.findLiveIds()).resolves.toEqual([
      'unit-2',
      'unit-1',
    ])
    expect(findMany).toHaveBeenLastCalledWith({
      where: { deletedAt: null },
      select: { id: true },
    })
  })
})
