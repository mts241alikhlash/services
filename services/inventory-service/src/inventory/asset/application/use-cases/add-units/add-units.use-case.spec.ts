import { NotFoundException } from '@nestjs/common'
import { AddUnitsUseCase } from './add-units.use-case.js'
import { IAssetRepository } from '../../../domain/repositories/asset.repository.js'
import { IAssetUnitRepository } from '../../../domain/repositories/asset-unit.repository.js'

describe('AddUnitsUseCase', () => {
  const input = {
    quantity: 2,
    conditionId: 'condition-1',
    statusId: 'status-1',
    locationId: 'location-1',
  }

  it('rejects missing assets before reading latest unit or creating rows', async () => {
    const findLatestUnit = jest.fn()
    const createMany = jest.fn()
    const assetRepository = {
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as IAssetRepository
    const unitRepository = {
      findLatestUnit,
      createMany,
      findByAsset: jest.fn(),
    } as unknown as IAssetUnitRepository
    const useCase = new AddUnitsUseCase(assetRepository, unitRepository)

    await expect(useCase.execute('asset-1', input)).rejects.toEqual(
      new NotFoundException('Asset with ID asset-1 not found'),
    )
    expect(findLatestUnit).not.toHaveBeenCalled()
    expect(createMany).not.toHaveBeenCalled()
  })

  it('continues unit numbering from latest record and returns refreshed units', async () => {
    const result = [{ id: 'unit-3' }, { id: 'unit-4' }]
    const findById = jest.fn().mockResolvedValue({
      id: 'asset-1',
      assetNumber: 'AST-COMP/2026/001',
      purchasePrice: 15000000,
    })
    const findLatestUnit = jest
      .fn()
      .mockResolvedValue({ unitNumber: 'AST-COMP/2026/001-02' })
    const createMany = jest.fn().mockResolvedValue(2)
    const findByAsset = jest.fn().mockResolvedValue(result)
    const unitRepository = {
      findLatestUnit,
      createMany,
      findByAsset,
    } as unknown as IAssetUnitRepository
    const assetRepository = { findById } as unknown as IAssetRepository
    const useCase = new AddUnitsUseCase(assetRepository, unitRepository)

    await expect(useCase.execute('asset-1', input)).resolves.toBe(result)

    expect(findLatestUnit).toHaveBeenCalledWith('asset-1')
    expect(findById.mock.invocationCallOrder[0]).toBeLessThan(
      findLatestUnit.mock.invocationCallOrder[0],
    )
    expect(findLatestUnit.mock.invocationCallOrder[0]).toBeLessThan(
      createMany.mock.invocationCallOrder[0],
    )
    expect(createMany.mock.invocationCallOrder[0]).toBeLessThan(
      findByAsset.mock.invocationCallOrder[0],
    )
    expect(createMany).toHaveBeenCalledWith([
      {
        assetId: 'asset-1',
        unitNumber: 'AST-COMP/2026/001-03',
        barcode: 'AST-COMP/2026/001-03',
        currentBookValue: 15000000,
        conditionId: 'condition-1',
        statusId: 'status-1',
        locationId: 'location-1',
      },
      {
        assetId: 'asset-1',
        unitNumber: 'AST-COMP/2026/001-04',
        barcode: 'AST-COMP/2026/001-04',
        currentBookValue: 15000000,
        conditionId: 'condition-1',
        statusId: 'status-1',
        locationId: 'location-1',
      },
    ])
    expect(findByAsset).toHaveBeenCalledWith('asset-1')
  })

  it('starts at unit 01 and defaults to one unit when no latest unit exists', async () => {
    const createMany = jest.fn().mockResolvedValue(1)
    const findByAsset = jest.fn().mockResolvedValue([{ id: 'unit-1' }])
    const findById = jest.fn().mockResolvedValue({
      id: 'asset-1',
      assetNumber: 'AST-COMP/2026/001',
      purchasePrice: 15000000,
    })
    const findLatestUnit = jest.fn().mockResolvedValue(null)
    const assetRepository = { findById } as unknown as IAssetRepository
    const unitRepository = {
      findLatestUnit,
      createMany,
      findByAsset,
    } as unknown as IAssetUnitRepository
    const useCase = new AddUnitsUseCase(assetRepository, unitRepository)

    await expect(
      useCase.execute('asset-1', { ...input, quantity: undefined }),
    ).resolves.toEqual([{ id: 'unit-1' }])

    expect(createMany).toHaveBeenCalledWith([
      {
        assetId: 'asset-1',
        unitNumber: 'AST-COMP/2026/001-01',
        barcode: 'AST-COMP/2026/001-01',
        currentBookValue: 15000000,
        conditionId: 'condition-1',
        statusId: 'status-1',
        locationId: 'location-1',
      },
    ])
    expect(findById.mock.invocationCallOrder[0]).toBeLessThan(
      findLatestUnit.mock.invocationCallOrder[0],
    )
    expect(findLatestUnit.mock.invocationCallOrder[0]).toBeLessThan(
      createMany.mock.invocationCallOrder[0],
    )
    expect(createMany.mock.invocationCallOrder[0]).toBeLessThan(
      findByAsset.mock.invocationCallOrder[0],
    )
  })

  it('propagates createMany errors without reloading units', async () => {
    const error = new Error('database unavailable')
    const createMany = jest.fn().mockRejectedValue(error)
    const findByAsset = jest.fn()
    const assetRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'asset-1',
        assetNumber: 'AST-COMP/2026/001',
        purchasePrice: 15000000,
      }),
    } as unknown as IAssetRepository
    const unitRepository = {
      findLatestUnit: jest.fn().mockResolvedValue(null),
      createMany,
      findByAsset,
    } as unknown as IAssetUnitRepository
    const useCase = new AddUnitsUseCase(assetRepository, unitRepository)

    await expect(useCase.execute('asset-1', input)).rejects.toBe(error)
    expect(findByAsset).not.toHaveBeenCalled()
  })

  it('propagates reload errors after creating units', async () => {
    const error = new Error('database unavailable')
    const findByAsset = jest.fn().mockRejectedValue(error)
    const assetRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'asset-1',
        assetNumber: 'AST-COMP/2026/001',
        purchasePrice: 15000000,
      }),
    } as unknown as IAssetRepository
    const unitRepository = {
      findLatestUnit: jest.fn().mockResolvedValue(null),
      createMany: jest.fn().mockResolvedValue(1),
      findByAsset,
    } as unknown as IAssetUnitRepository
    const useCase = new AddUnitsUseCase(assetRepository, unitRepository)

    await expect(useCase.execute('asset-1', input)).rejects.toBe(error)
  })
})
