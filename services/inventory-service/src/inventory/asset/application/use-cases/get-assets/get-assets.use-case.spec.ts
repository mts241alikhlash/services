import { GetAssetsUseCase } from './get-assets.use-case.js'
import { IAssetRepository } from '../../../domain/repositories/asset.repository.js'

describe('GetAssetsUseCase', () => {
  it('maps every asset filter and returns repository pagination', async () => {
    const result = { data: [{ id: 'asset-1' }], total: 1, page: 2, limit: 5 }
    const findAll = jest.fn().mockResolvedValue(result)
    const repository = { findAll } as unknown as IAssetRepository
    const useCase = new GetAssetsUseCase(repository)
    const query = {
      page: 2,
      limit: 5,
      keyword: 'laptop',
      categoryId: 'category-1',
      locationId: 'location-1',
      statusId: 'status-1',
      conditionId: 'condition-1',
      fundingSourceId: 'funding-1',
    }

    await expect(useCase.execute(query)).resolves.toBe(result)
    expect(findAll).toHaveBeenCalledWith(query)
  })

  it('forwards empty queries with explicit undefined fields', async () => {
    const findAll = jest.fn().mockResolvedValue({ data: [] })
    const repository = { findAll } as unknown as IAssetRepository
    const useCase = new GetAssetsUseCase(repository)

    await useCase.execute({})

    expect(findAll).toHaveBeenCalledWith({
      page: undefined,
      limit: undefined,
      keyword: undefined,
      categoryId: undefined,
      locationId: undefined,
      statusId: undefined,
      conditionId: undefined,
      fundingSourceId: undefined,
    })
  })

  it('propagates repository read errors', async () => {
    const error = new Error('database unavailable')
    const repository = {
      findAll: jest.fn().mockRejectedValue(error),
    } as unknown as IAssetRepository
    const useCase = new GetAssetsUseCase(repository)

    await expect(useCase.execute({})).rejects.toBe(error)
  })
})
