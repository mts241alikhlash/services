import { GetAssetUnitsUseCase } from './get-asset-units.use-case.js'
import { IAssetUnitRepository } from '../../../domain/repositories/asset-unit.repository.js'

describe('GetAssetUnitsUseCase', () => {
  it('forwards pagination, lendability, and search to the unit repository', async () => {
    const result = { data: [{ id: 'unit-1' }], total: 1, page: 1, limit: 10 }
    const findAll = jest.fn().mockResolvedValue(result)
    const repository = { findAll } as unknown as IAssetUnitRepository
    const useCase = new GetAssetUnitsUseCase(repository)
    const query = { page: 1, limit: 10, lendable: true, search: 'laptop' }

    await expect(useCase.execute(query)).resolves.toBe(result)
    expect(findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      lendable: true,
      search: 'laptop',
    })
  })

  it('forwards empty queries with explicit undefined fields', async () => {
    const findAll = jest.fn().mockResolvedValue({ data: [] })
    const repository = { findAll } as unknown as IAssetUnitRepository
    const useCase = new GetAssetUnitsUseCase(repository)

    await useCase.execute({})

    expect(findAll).toHaveBeenCalledWith({
      page: undefined,
      limit: undefined,
      lendable: undefined,
      search: undefined,
    })
  })

  it('forwards an explicit false lendable filter and search', async () => {
    const findAll = jest.fn().mockResolvedValue({ data: [] })
    const repository = { findAll } as unknown as IAssetUnitRepository
    const useCase = new GetAssetUnitsUseCase(repository)

    await useCase.execute({ lendable: false, search: 'AST-COMP' })

    expect(findAll).toHaveBeenCalledWith({
      page: undefined,
      limit: undefined,
      lendable: false,
      search: 'AST-COMP',
    })
  })

  it('propagates repository read errors', async () => {
    const error = new Error('database unavailable')
    const repository = {
      findAll: jest.fn().mockRejectedValue(error),
    } as unknown as IAssetUnitRepository
    const useCase = new GetAssetUnitsUseCase(repository)

    await expect(useCase.execute({})).rejects.toBe(error)
  })
})
