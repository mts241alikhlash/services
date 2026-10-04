import { BadRequestException, NotFoundException } from '@nestjs/common'
import { InventoryStatusKey } from '../../../../../shared/domain/enums/inventory-status-key.enum.js'
import { IStatusRepository } from '../../domain/repositories/status.repository.js'
import { CreateStatusUseCase } from './create-status/create-status.use-case.js'
import { DeleteStatusUseCase } from './delete-status/delete-status.use-case.js'
import { GetStatusesUseCase } from './get-statuses/get-statuses.use-case.js'
import { UpdateStatusUseCase } from './update-status/update-status.use-case.js'

describe('status use cases', () => {
  const status = {
    id: 'status-1',
    code: 'STATUS-ACTIVE',
    name: 'Active',
    allowTransactions: true,
    systemKey: null,
    createdAt: new Date('2026-09-14T00:00:00.000Z'),
  }

  function makeRepository() {
    return {
      findMany: jest.fn().mockResolvedValue([status]),
      findById: jest.fn().mockResolvedValue(status),
      create: jest.fn().mockResolvedValue(status),
      update: jest.fn().mockResolvedValue(status),
      delete: jest.fn().mockResolvedValue(status),
    } as unknown as jest.Mocked<IStatusRepository>
  }

  it('maps create input and preserves defaults', async () => {
    const repository = makeRepository()
    const useCase = new CreateStatusUseCase(repository)
    const input = {
      code: 'STATUS-ACTIVE',
      name: 'Active',
      allowTransactions: undefined,
      systemKey: undefined,
      ignored: 'field',
    }

    await expect(useCase.execute(input)).resolves.toBe(status)

    expect(repository.create).toHaveBeenCalledWith({
      code: 'STATUS-ACTIVE',
      name: 'Active',
      allowTransactions: true,
      systemKey: null,
    })
  })

  it('preserves explicit false and system key when creating', async () => {
    const repository = makeRepository()
    const useCase = new CreateStatusUseCase(repository)

    await useCase.execute({
      code: 'STATUS-AVAILABLE',
      name: 'Available',
      allowTransactions: false,
      systemKey: InventoryStatusKey.AVAILABLE,
    })

    expect(repository.create).toHaveBeenCalledWith({
      code: 'STATUS-AVAILABLE',
      name: 'Available',
      allowTransactions: false,
      systemKey: InventoryStatusKey.AVAILABLE,
    })
  })

  it('forwards search and returns statuses', async () => {
    const repository = makeRepository()
    const useCase = new GetStatusesUseCase(repository)

    await expect(useCase.execute('active')).resolves.toEqual([status])
    expect(repository.findMany).toHaveBeenCalledWith('active')
  })

  it('rejects update when status does not exist', async () => {
    const repository = makeRepository()
    repository.findById.mockResolvedValue(null)
    const useCase = new UpdateStatusUseCase(repository)

    await expect(
      useCase.execute('missing', { name: 'Missing' }),
    ).rejects.toEqual(new NotFoundException('Status with ID missing not found'))
    expect(repository.update).not.toHaveBeenCalled()
  })

  it('maps update input and preserves false and explicit null', async () => {
    const repository = makeRepository()
    const useCase = new UpdateStatusUseCase(repository)
    const input = {
      code: 'STATUS-CLOSED',
      name: 'Closed',
      allowTransactions: false,
      systemKey: null,
      ignored: 'field',
    }

    await expect(useCase.execute(status.id, input)).resolves.toBe(status)

    expect(repository.update).toHaveBeenCalledWith(status.id, {
      code: 'STATUS-CLOSED',
      name: 'Closed',
      allowTransactions: false,
      systemKey: null,
    })
  })

  it('keeps omitted system key undefined when updating', async () => {
    const repository = makeRepository()
    const useCase = new UpdateStatusUseCase(repository)

    await useCase.execute(status.id, { name: 'Renamed' })

    expect(repository.update).toHaveBeenCalledWith(status.id, {
      code: undefined,
      name: 'Renamed',
      allowTransactions: true,
      systemKey: undefined,
    })
  })

  it('rejects delete when status does not exist', async () => {
    const repository = makeRepository()
    repository.findById.mockResolvedValue(null)
    const useCase = new DeleteStatusUseCase(repository)

    await expect(useCase.execute('missing')).rejects.toEqual(
      new NotFoundException('Status with ID missing not found'),
    )
    expect(repository.delete).not.toHaveBeenCalled()
  })

  it('rejects deleting a status with a system key', async () => {
    const repository = makeRepository()
    repository.findById.mockResolvedValue({
      ...status,
      name: 'Available',
      systemKey: InventoryStatusKey.AVAILABLE,
    })
    const useCase = new DeleteStatusUseCase(repository)

    await expect(useCase.execute(status.id)).rejects.toEqual(
      new BadRequestException(
        'Status "Available" fills the "AVAILABLE" role in the loan workflow and cannot be deleted. Release its system role first.',
      ),
    )
    expect(repository.delete).not.toHaveBeenCalled()
  })

  it('deletes an unprotected status and returns repository result', async () => {
    const repository = makeRepository()
    const useCase = new DeleteStatusUseCase(repository)

    await expect(useCase.execute(status.id)).resolves.toBe(status)
    expect(repository.delete).toHaveBeenCalledWith(status.id)
  })
})
