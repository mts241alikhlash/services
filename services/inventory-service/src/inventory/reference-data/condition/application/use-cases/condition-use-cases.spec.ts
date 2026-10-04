import { NotFoundException } from '@nestjs/common'
import { IConditionRepository } from '../../domain/repositories/condition.repository.js'
import { CreateConditionUseCase } from './create-condition/create-condition.use-case.js'
import { DeleteConditionUseCase } from './delete-condition/delete-condition.use-case.js'
import { GetConditionsUseCase } from './get-conditions/get-conditions.use-case.js'
import { UpdateConditionUseCase } from './update-condition/update-condition.use-case.js'

describe('condition use cases', () => {
  const condition = {
    id: 'condition-1',
    code: 'COND-GOOD',
    name: 'Baik',
    isUsable: true,
    createdAt: new Date('2026-09-13T00:00:00.000Z'),
  }

  function makeRepository() {
    return {
      findMany: jest.fn().mockResolvedValue([condition]),
      findById: jest.fn().mockResolvedValue(condition),
      create: jest.fn().mockResolvedValue(condition),
      update: jest.fn().mockResolvedValue(condition),
      delete: jest.fn().mockResolvedValue(condition),
    } as unknown as jest.Mocked<IConditionRepository>
  }

  it('defaults isUsable when creating a condition', async () => {
    const repository = makeRepository()
    const useCase = new CreateConditionUseCase(repository)

    await useCase.execute({ code: 'COND-GOOD', name: 'Baik' })

    expect(repository.create).toHaveBeenCalledWith({
      code: 'COND-GOOD',
      name: 'Baik',
      isUsable: true,
    })
  })

  it('forwards search to condition lookup', async () => {
    const repository = makeRepository()
    const useCase = new GetConditionsUseCase(repository)

    await useCase.execute('baik')

    expect(repository.findMany).toHaveBeenCalledWith('baik')
  })

  it('rejects update when condition does not exist', async () => {
    const repository = makeRepository()
    repository.findById.mockResolvedValue(null)
    const useCase = new UpdateConditionUseCase(repository)

    await expect(
      useCase.execute('missing', { name: 'Rusak' }),
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(repository.update).not.toHaveBeenCalled()
  })

  it('maps update input and defaults isUsable', async () => {
    const repository = makeRepository()
    const useCase = new UpdateConditionUseCase(repository)
    const input = {
      code: 'COND-USED',
      name: 'Bekas',
      ignored: 'field',
    }

    await useCase.execute(condition.id, input)

    expect(repository.update).toHaveBeenCalledWith(condition.id, {
      code: input.code,
      name: input.name,
      isUsable: true,
    })
  })

  it('preserves false isUsable when updating a condition', async () => {
    const repository = makeRepository()
    const useCase = new UpdateConditionUseCase(repository)

    await useCase.execute(condition.id, { isUsable: false })

    expect(repository.update).toHaveBeenCalledWith(condition.id, {
      code: undefined,
      name: undefined,
      isUsable: false,
    })
  })

  it('rejects delete when condition does not exist', async () => {
    const repository = makeRepository()
    repository.findById.mockResolvedValue(null)
    const useCase = new DeleteConditionUseCase(repository)

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    )
    expect(repository.delete).not.toHaveBeenCalled()
  })

  it('delegates delete after finding condition', async () => {
    const repository = makeRepository()
    const useCase = new DeleteConditionUseCase(repository)

    await useCase.execute(condition.id)

    expect(repository.delete).toHaveBeenCalledWith(condition.id)
  })
})
