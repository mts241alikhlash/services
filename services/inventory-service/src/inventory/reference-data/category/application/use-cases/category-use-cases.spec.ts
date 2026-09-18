import { NotFoundException } from '@nestjs/common'
import { ICategoryRepository } from '../../domain/repositories/category.repository.js'
import { CreateCategoryUseCase } from './create-category/create-category.use-case.js'
import { DeleteCategoryUseCase } from './delete-category/delete-category.use-case.js'
import { GetCategoriesUseCase } from './get-categories/get-categories.use-case.js'
import { UpdateCategoryUseCase } from './update-category/update-category.use-case.js'

describe('category use cases', () => {
  const category = {
    id: 'category-1',
    code: 'CAT-001',
    name: 'Electronics',
  }

  function makeRepository() {
    return {
      findMany: jest.fn().mockResolvedValue([category]),
      findById: jest.fn().mockResolvedValue(category),
      create: jest.fn().mockResolvedValue(category),
      update: jest.fn().mockResolvedValue(category),
      delete: jest.fn().mockResolvedValue(category),
    } as unknown as jest.Mocked<ICategoryRepository>
  }

  it('maps create input before delegating', async () => {
    const repository = makeRepository()
    const useCase = new CreateCategoryUseCase(repository)
    const input = {
      code: 'CAT-001',
      name: 'Electronics',
      depreciationRatePercent: 10,
      ignored: 'field',
    }

    await useCase.execute(input)

    expect(repository.create).toHaveBeenCalledWith({
      code: input.code,
      name: input.name,
      depreciationRatePercent: input.depreciationRatePercent,
    })
  })

  it('forwards search to category lookup', async () => {
    const repository = makeRepository()
    const useCase = new GetCategoriesUseCase(repository)

    await useCase.execute('electronics')

    expect(repository.findMany).toHaveBeenCalledWith('electronics')
  })

  it('rejects update when category does not exist', async () => {
    const repository = makeRepository()
    repository.findById.mockResolvedValue(null)
    const useCase = new UpdateCategoryUseCase(repository)

    await expect(
      useCase.execute('missing', { name: 'Updated', code: 'CAT-002' }),
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(repository.update).not.toHaveBeenCalled()
  })

  it('maps update input after finding category', async () => {
    const repository = makeRepository()
    const useCase = new UpdateCategoryUseCase(repository)
    const input = {
      code: 'CAT-002',
      name: 'Updated electronics',
      depreciationRatePercent: 12,
      ignored: 'field',
    }

    await useCase.execute(category.id, input)

    expect(repository.update).toHaveBeenCalledWith(category.id, {
      code: input.code,
      name: input.name,
      depreciationRatePercent: input.depreciationRatePercent,
    })
  })

  it('rejects delete when category does not exist', async () => {
    const repository = makeRepository()
    repository.findById.mockResolvedValue(null)
    const useCase = new DeleteCategoryUseCase(repository)

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    )
    expect(repository.delete).not.toHaveBeenCalled()
  })

  it('delegates delete after finding category', async () => {
    const repository = makeRepository()
    const useCase = new DeleteCategoryUseCase(repository)

    await useCase.execute(category.id)

    expect(repository.delete).toHaveBeenCalledWith(category.id)
  })
})
