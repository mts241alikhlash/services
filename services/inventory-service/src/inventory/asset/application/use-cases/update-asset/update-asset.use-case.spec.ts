import { ConflictException, NotFoundException } from '@nestjs/common'
import { UpdateAssetUseCase } from './update-asset.use-case.js'
import { IAssetRepository } from '../../../domain/repositories/asset.repository.js'
import { UpdateAssetInput } from './update-asset.input.js'

describe('UpdateAssetUseCase', () => {
  const input = {
    name: 'Updated laptop',
    brand: 'Lenovo',
    model: 'T14 Gen 5',
    assetNumber: 'AST-COMP/2026/001',
    purchaseDate: '2026-02-01',
    purchasePrice: 16000000,
    usefulLifeMonths: 60,
    fundingSourceId: 'funding-2',
    categoryId: 'category-2',
    notes: 'Updated note',
  }

  it('checks existence, maps update fields, and returns updated asset', async () => {
    const result = { id: 'asset-1', name: 'Updated laptop' }
    const findById = jest.fn().mockResolvedValue({ id: 'asset-1' })
    const update = jest.fn().mockResolvedValue(result)
    const repository = { findById, update } as unknown as IAssetRepository
    const useCase = new UpdateAssetUseCase(repository)

    await expect(useCase.execute('asset-1', input)).resolves.toBe(result)

    expect(findById).toHaveBeenCalledWith('asset-1')
    expect(update).toHaveBeenCalledWith('asset-1', {
      name: 'Updated laptop',
      brand: 'Lenovo',
      model: 'T14 Gen 5',
      assetNumber: 'AST-COMP/2026/001',
      purchaseDate: new Date('2026-02-01'),
      purchasePrice: 16000000,
      usefulLifeMonths: 60,
      notes: 'Updated note',
      categoryId: 'category-2',
      fundingSourceId: 'funding-2',
    })
  })

  it('maps omitted optional values to undefined', async () => {
    const update = jest.fn().mockResolvedValue({ id: 'asset-1' })
    const repository = {
      findById: jest.fn().mockResolvedValue({ id: 'asset-1' }),
      update,
    } as unknown as IAssetRepository
    const useCase = new UpdateAssetUseCase(repository)

    await useCase.execute('asset-1', {
      name: 'Updated laptop',
      brand: null,
    } as unknown as UpdateAssetInput)

    expect(update).toHaveBeenCalledWith('asset-1', {
      name: 'Updated laptop',
      brand: undefined,
      model: undefined,
      assetNumber: undefined,
      purchaseDate: undefined,
      purchasePrice: undefined,
      usefulLifeMonths: undefined,
      notes: undefined,
      categoryId: undefined,
      fundingSourceId: undefined,
    })
  })

  it('rejects missing assets before updating', async () => {
    const update = jest.fn()
    const repository = {
      findById: jest.fn().mockResolvedValue(null),
      update,
    } as unknown as IAssetRepository
    const useCase = new UpdateAssetUseCase(repository)

    await expect(useCase.execute('missing-asset', {})).rejects.toEqual(
      new NotFoundException('Asset with ID missing-asset not found'),
    )
    expect(update).not.toHaveBeenCalled()
  })

  it('propagates update conflicts without translating them', async () => {
    const conflict = new ConflictException('asset number already exists')
    const repository = {
      findById: jest.fn().mockResolvedValue({ id: 'asset-1' }),
      update: jest.fn().mockRejectedValue(conflict),
    } as unknown as IAssetRepository
    const useCase = new UpdateAssetUseCase(repository)

    await expect(useCase.execute('asset-1', input)).rejects.toBe(conflict)
  })
})
