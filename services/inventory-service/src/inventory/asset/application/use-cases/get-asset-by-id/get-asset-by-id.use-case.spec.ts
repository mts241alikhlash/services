import { NotFoundException } from '@nestjs/common'
import { GetAssetByIdUseCase } from './get-asset-by-id.use-case.js'
import { IAssetRepository } from '../../../domain/repositories/asset.repository.js'

describe('GetAssetByIdUseCase', () => {
  it('returns the repository asset', async () => {
    const asset = { id: 'asset-1', assetNumber: 'AST-COMP/2026/001' }
    const findById = jest.fn().mockResolvedValue(asset)
    const repository = { findById } as unknown as IAssetRepository
    const useCase = new GetAssetByIdUseCase(repository)

    await expect(useCase.execute('asset-1')).resolves.toBe(asset)
    expect(findById).toHaveBeenCalledWith('asset-1')
  })

  it('throws not found when repository returns no asset', async () => {
    const findById = jest.fn().mockResolvedValue(null)
    const repository = { findById } as unknown as IAssetRepository
    const useCase = new GetAssetByIdUseCase(repository)

    await expect(useCase.execute('missing-asset')).rejects.toEqual(
      new NotFoundException('Asset with ID missing-asset not found'),
    )
  })

  it('propagates repository read errors', async () => {
    const error = new Error('database unavailable')
    const repository = {
      findById: jest.fn().mockRejectedValue(error),
    } as unknown as IAssetRepository
    const useCase = new GetAssetByIdUseCase(repository)

    await expect(useCase.execute('asset-1')).rejects.toBe(error)
  })
})
