import { ConflictException } from '@nestjs/common'
import { CreateAssetUseCase } from './create-asset.use-case.js'
import { IAssetRepository } from '../../../domain/repositories/asset.repository.js'

describe('CreateAssetUseCase', () => {
  const input = {
    name: 'Laptop',
    quantity: 2,
    categoryId: 'category-1',
    brand: 'Lenovo',
    model: 'T14',
    barcode: 'barcode-1',
    purchaseDate: '2026-01-15',
    purchasePrice: 15000000,
    usefulLifeMonths: 48,
    fundingSourceId: 'funding-1',
    locationId: 'location-1',
    statusId: 'status-1',
    conditionId: 'condition-1',
    notes: 'Staff device',
  }

  it('looks up category and latest sequence before creating mapped units', async () => {
    const result = { id: 'asset-1' }
    const findCategoryById = jest
      .fn()
      .mockResolvedValue({ id: 'category-1', code: 'comp' })
    const findLatestAssetByPrefix = jest
      .fn()
      .mockResolvedValue({ assetNumber: 'AST-COMP/2026/007' })
    const create = jest.fn().mockResolvedValue(result)
    const repository = {
      findCategoryById,
      findLatestAssetByPrefix,
      create,
    } as unknown as IAssetRepository
    const useCase = new CreateAssetUseCase(repository)

    await expect(useCase.execute(input)).resolves.toBe(result)

    expect(findCategoryById).toHaveBeenCalledWith('category-1')
    expect(findLatestAssetByPrefix).toHaveBeenCalledWith('AST-COMP/2026/')
    expect(findCategoryById.mock.invocationCallOrder[0]).toBeLessThan(
      findLatestAssetByPrefix.mock.invocationCallOrder[0],
    )
    expect(findLatestAssetByPrefix.mock.invocationCallOrder[0]).toBeLessThan(
      create.mock.invocationCallOrder[0],
    )
    expect(create).toHaveBeenCalledWith({
      assetNumber: 'AST-COMP/2026/008',
      name: 'Laptop',
      brand: 'Lenovo',
      model: 'T14',
      purchaseDate: new Date('2026-01-15'),
      purchasePrice: 15000000,
      usefulLifeMonths: 48,
      notes: 'Staff device',
      categoryId: 'category-1',
      fundingSourceId: 'funding-1',
      units: [
        {
          unitNumber: 'AST-COMP/2026/008-01',
          barcode: 'AST-COMP/2026/008-01',
          currentBookValue: 15000000,
          conditionId: 'condition-1',
          statusId: 'status-1',
          locationId: 'location-1',
        },
        {
          unitNumber: 'AST-COMP/2026/008-02',
          barcode: 'AST-COMP/2026/008-02',
          currentBookValue: 15000000,
          conditionId: 'condition-1',
          statusId: 'status-1',
          locationId: 'location-1',
        },
      ],
    })
  })

  it('defaults missing category and quantity while preserving a single barcode', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'asset-1' })
    const repository = {
      findCategoryById: jest.fn().mockResolvedValue(null),
      findLatestAssetByPrefix: jest.fn().mockResolvedValue(null),
      create,
    } as unknown as IAssetRepository
    const useCase = new CreateAssetUseCase(repository)

    await useCase.execute({
      ...input,
      quantity: undefined,
      barcode: 'single-barcode',
    })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        assetNumber: 'AST-GEN/2026/001',
        units: [
          expect.objectContaining({
            unitNumber: 'AST-GEN/2026/001-01',
            barcode: 'single-barcode',
          }),
        ],
      }),
    )
  })

  it('uses an optional custom asset number for the asset and its units', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'asset-1' })
    const repository = {
      findCategoryById: jest
        .fn()
        .mockResolvedValue({ id: 'category-1', code: 'comp' }),
      findLatestAssetByPrefix: jest.fn().mockResolvedValue({
        assetNumber: 'AST-COMP/2026/007',
      }),
      create,
    } as unknown as IAssetRepository
    const useCase = new CreateAssetUseCase(repository)

    await useCase.execute({
      ...input,
      assetNumber: 'CUSTOM-ASSET-001',
      quantity: 2,
    })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        assetNumber: 'CUSTOM-ASSET-001',
        units: [
          expect.objectContaining({
            unitNumber: 'CUSTOM-ASSET-001-01',
            barcode: 'CUSTOM-ASSET-001-01',
          }),
          expect.objectContaining({
            unitNumber: 'CUSTOM-ASSET-001-02',
            barcode: 'CUSTOM-ASSET-001-02',
          }),
        ],
      }),
    )
  })

  it('maps omitted create fields and falls back to one unit for non-positive quantity', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'asset-1' })
    const findCategoryById = jest.fn().mockResolvedValue(null)
    const findLatestAssetByPrefix = jest.fn().mockResolvedValue(null)
    const repository = {
      findCategoryById,
      findLatestAssetByPrefix,
      create,
    } as unknown as IAssetRepository
    const useCase = new CreateAssetUseCase(repository)

    await useCase.execute({
      ...input,
      quantity: 0,
      brand: undefined,
      model: undefined,
      usefulLifeMonths: undefined,
      fundingSourceId: undefined,
      notes: undefined,
      barcode: undefined,
    })

    expect(create).toHaveBeenCalledWith({
      assetNumber: 'AST-GEN/2026/001',
      name: 'Laptop',
      brand: null,
      model: null,
      purchaseDate: new Date('2026-01-15'),
      purchasePrice: 15000000,
      usefulLifeMonths: undefined,
      notes: null,
      categoryId: 'category-1',
      fundingSourceId: undefined,
      units: [
        {
          unitNumber: 'AST-GEN/2026/001-01',
          barcode: 'AST-GEN/2026/001-01',
          currentBookValue: 15000000,
          conditionId: 'condition-1',
          statusId: 'status-1',
          locationId: 'location-1',
        },
      ],
    })
    expect(findCategoryById.mock.invocationCallOrder[0]).toBeLessThan(
      findLatestAssetByPrefix.mock.invocationCallOrder[0],
    )
    expect(findLatestAssetByPrefix.mock.invocationCallOrder[0]).toBeLessThan(
      create.mock.invocationCallOrder[0],
    )
  })

  it('propagates repository conflicts without translating them', async () => {
    const conflict = new ConflictException('asset number already exists')
    const repository = {
      findCategoryById: jest
        .fn()
        .mockResolvedValue({ id: 'category-1', code: 'comp' }),
      findLatestAssetByPrefix: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockRejectedValue(conflict),
    } as unknown as IAssetRepository
    const useCase = new CreateAssetUseCase(repository)

    await expect(useCase.execute(input)).rejects.toBe(conflict)
    expect(repository.create).toHaveBeenCalled()
  })
})
