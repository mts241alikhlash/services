import { ConflictException, NotFoundException } from '@nestjs/common'
import { UpdateUnitUseCase } from './update-unit.use-case.js'
import { IAssetUnitRepository } from '../../../domain/repositories/asset-unit.repository.js'
import { UpdateUnitInput } from './update-unit.input.js'

describe('UpdateUnitUseCase', () => {
  const input = {
    barcode: 'barcode-2',
    notes: 'Reassigned',
    custodianId: 'custodian-2',
    conditionId: 'condition-2',
    statusId: 'status-2',
    locationId: 'location-2',
  }

  it('checks existence, maps update fields, and returns updated unit', async () => {
    const result = { id: 'unit-1', barcode: 'barcode-2' }
    const findById = jest.fn().mockResolvedValue({ id: 'unit-1' })
    const update = jest.fn().mockResolvedValue(result)
    const repository = { findById, update } as unknown as IAssetUnitRepository
    const useCase = new UpdateUnitUseCase(repository)

    await expect(useCase.execute('unit-1', input)).resolves.toBe(result)

    expect(findById).toHaveBeenCalledWith('unit-1')
    expect(update).toHaveBeenCalledWith('unit-1', input)
  })

  it('maps omitted optional values to undefined', async () => {
    const update = jest.fn().mockResolvedValue({ id: 'unit-1' })
    const repository = {
      findById: jest.fn().mockResolvedValue({ id: 'unit-1' }),
      update,
    } as unknown as IAssetUnitRepository
    const useCase = new UpdateUnitUseCase(repository)

    await useCase.execute('unit-1', {
      notes: null,
    } as unknown as UpdateUnitInput)

    expect(update).toHaveBeenCalledWith('unit-1', {
      barcode: undefined,
      notes: undefined,
      custodianId: undefined,
      conditionId: undefined,
      statusId: undefined,
      locationId: undefined,
    })
  })

  it('rejects missing units before updating', async () => {
    const update = jest.fn()
    const repository = {
      findById: jest.fn().mockResolvedValue(null),
      update,
    } as unknown as IAssetUnitRepository
    const useCase = new UpdateUnitUseCase(repository)

    await expect(useCase.execute('missing-unit', {})).rejects.toEqual(
      new NotFoundException('Asset unit with ID missing-unit not found'),
    )
    expect(update).not.toHaveBeenCalled()
  })

  it('propagates update conflicts without translating them', async () => {
    const conflict = new ConflictException('barcode already exists')
    const repository = {
      findById: jest.fn().mockResolvedValue({ id: 'unit-1' }),
      update: jest.fn().mockRejectedValue(conflict),
    } as unknown as IAssetUnitRepository
    const useCase = new UpdateUnitUseCase(repository)

    await expect(useCase.execute('unit-1', input)).rejects.toBe(conflict)
  })
})
