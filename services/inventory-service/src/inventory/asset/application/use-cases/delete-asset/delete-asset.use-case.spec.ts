import { NotFoundException } from '@nestjs/common'
import { DeleteAssetUseCase } from './delete-asset.use-case.js'
import { IAssetRepository } from '../../../domain/repositories/asset.repository.js'

describe('DeleteAssetUseCase', () => {
  it('checks existence and soft-deletes the asset', async () => {
    const softDelete = jest.fn().mockResolvedValue({ id: 'asset-1' })
    const repository = {
      findById: jest.fn().mockResolvedValue({ id: 'asset-1' }),
      softDelete,
    } as unknown as IAssetRepository
    const useCase = new DeleteAssetUseCase(repository)

    await expect(useCase.execute('asset-1')).resolves.toBeUndefined()
    expect(repository.findById).toHaveBeenCalledWith('asset-1')
    expect(softDelete).toHaveBeenCalledWith('asset-1')
  })

  it('rejects missing assets without soft-deleting', async () => {
    const softDelete = jest.fn()
    const repository = {
      findById: jest.fn().mockResolvedValue(null),
      softDelete,
    } as unknown as IAssetRepository
    const useCase = new DeleteAssetUseCase(repository)

    await expect(useCase.execute('missing-asset')).rejects.toEqual(
      new NotFoundException('Asset with ID missing-asset not found'),
    )
    expect(softDelete).not.toHaveBeenCalled()
  })

  it('propagates soft-delete errors', async () => {
    const error = new Error('database unavailable')
    const repository = {
      findById: jest.fn().mockResolvedValue({ id: 'asset-1' }),
      softDelete: jest.fn().mockRejectedValue(error),
    } as unknown as IAssetRepository
    const useCase = new DeleteAssetUseCase(repository)

    await expect(useCase.execute('asset-1')).rejects.toBe(error)
  })
})
