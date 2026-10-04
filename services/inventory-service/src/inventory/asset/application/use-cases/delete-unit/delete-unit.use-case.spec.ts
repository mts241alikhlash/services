import { NotFoundException } from '@nestjs/common'
import { DeleteUnitUseCase } from './delete-unit.use-case.js'
import { IAssetUnitRepository } from '../../../domain/repositories/asset-unit.repository.js'

describe('DeleteUnitUseCase', () => {
  it('checks existence and soft-deletes the unit', async () => {
    const softDelete = jest.fn().mockResolvedValue({ id: 'unit-1' })
    const repository = {
      findById: jest.fn().mockResolvedValue({ id: 'unit-1' }),
      softDelete,
    } as unknown as IAssetUnitRepository
    const useCase = new DeleteUnitUseCase(repository)

    await expect(useCase.execute('unit-1')).resolves.toBeUndefined()
    expect(repository.findById).toHaveBeenCalledWith('unit-1')
    expect(softDelete).toHaveBeenCalledWith('unit-1')
  })

  it('rejects missing units without soft-deleting', async () => {
    const softDelete = jest.fn()
    const repository = {
      findById: jest.fn().mockResolvedValue(null),
      softDelete,
    } as unknown as IAssetUnitRepository
    const useCase = new DeleteUnitUseCase(repository)

    await expect(useCase.execute('missing-unit')).rejects.toEqual(
      new NotFoundException('Asset unit with ID missing-unit not found'),
    )
    expect(softDelete).not.toHaveBeenCalled()
  })

  it('propagates soft-delete errors', async () => {
    const error = new Error('database unavailable')
    const repository = {
      findById: jest.fn().mockResolvedValue({ id: 'unit-1' }),
      softDelete: jest.fn().mockRejectedValue(error),
    } as unknown as IAssetUnitRepository
    const useCase = new DeleteUnitUseCase(repository)

    await expect(useCase.execute('unit-1')).rejects.toBe(error)
  })
})
