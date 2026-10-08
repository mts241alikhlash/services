import { ConflictException, NotFoundException } from '@nestjs/common'
import { IPositionCategoryRepository } from '../../domain/repositories/position-category.repository.js'
import { CreatePositionCategoryUseCase } from './create-position-category/create-position-category.use-case.js'
import { UpdatePositionCategoryUseCase } from './update-position-category/update-position-category.use-case.js'
import { DeletePositionCategoryUseCase } from './delete-position-category/delete-position-category.use-case.js'

describe('position category writes', () => {
  const repository = {
    findByCode: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    countPositionsWithCategory: jest.fn(),
  }
  const port = repository as unknown as IPositionCategoryRepository
  const create = new CreatePositionCategoryUseCase(port)
  const update = new UpdatePositionCategoryUseCase(port)
  const remove = new DeletePositionCategoryUseCase(port)

  beforeEach(() => {
    jest.resetAllMocks()
    repository.findByCode.mockResolvedValue(null)
    repository.findById.mockResolvedValue({ id: 'cat-1' })
    repository.create.mockResolvedValue({ id: 'cat-1', code: 'ACADEMIC' })
    repository.countPositionsWithCategory.mockResolvedValue(0)
  })

  it('rejects a duplicate code before creating', async () => {
    repository.findByCode.mockResolvedValue({ id: 'cat-1' })
    await expect(
      create.execute({ code: 'ACADEMIC', name: 'Akademik' }),
    ).rejects.toThrow(ConflictException)
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('creates with the requested code and name', async () => {
    await create.execute({ code: 'ACADEMIC', name: 'Akademik' })
    expect(repository.create).toHaveBeenCalledWith({
      code: 'ACADEMIC',
      name: 'Akademik',
    })
  })

  it('rejects updating a missing category', async () => {
    repository.findById.mockResolvedValue(null)
    await expect(update.execute('cat-1', { name: 'Baru' })).rejects.toThrow(
      NotFoundException,
    )
    expect(repository.update).not.toHaveBeenCalled()
  })

  it('updates only the name', async () => {
    await update.execute('cat-1', { name: 'Baru' })
    expect(repository.update).toHaveBeenCalledWith('cat-1', { name: 'Baru' })
  })

  it('refuses deletion when positions use the category', async () => {
    repository.countPositionsWithCategory.mockResolvedValue(2)
    await expect(remove.execute('cat-1')).rejects.toThrow(ConflictException)
    expect(repository.remove).not.toHaveBeenCalled()
  })

  it('removes a category with no positions', async () => {
    await remove.execute('cat-1')
    expect(repository.remove).toHaveBeenCalledWith('cat-1')
  })
})
