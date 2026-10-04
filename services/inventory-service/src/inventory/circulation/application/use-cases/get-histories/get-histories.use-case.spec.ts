import { IHistoryRepository } from '../../../domain/repositories/history.repository.js'
import { GetHistoriesUseCase } from './get-histories.use-case.js'

describe('GetHistoriesUseCase', () => {
  it('maps pagination and unit filtering and returns repository data', async () => {
    const result = {
      data: [{ id: 'history-1' }],
      meta: { page: 3, limit: 25, total: 1, totalPages: 1 },
    }
    const findAllHistories = jest.fn().mockResolvedValue(result)
    const repository = { findAllHistories } as unknown as IHistoryRepository
    const useCase = new GetHistoriesUseCase(repository)
    const query = { page: 3, limit: 25, unitId: 'unit-1' }

    await expect(useCase.execute(query)).resolves.toBe(result)
    expect(findAllHistories).toHaveBeenCalledWith(query)
  })

  it('forwards an empty query with explicit undefined fields', async () => {
    const findAllHistories = jest.fn().mockResolvedValue({ data: [] })
    const repository = { findAllHistories } as unknown as IHistoryRepository
    const useCase = new GetHistoriesUseCase(repository)

    await useCase.execute({})

    expect(findAllHistories).toHaveBeenCalledWith({
      page: undefined,
      limit: undefined,
      unitId: undefined,
    })
  })
})
