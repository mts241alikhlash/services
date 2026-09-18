import type { PrismaService } from '../../../../../../core/database/prisma.service.js'
import { PrismaCategoryRepository } from './prisma-category.repository.js'

describe('PrismaCategoryRepository', () => {
  const prismaCategory = {
    id: 'category-1',
    code: 'CAT-001',
    name: 'Electronics',
    parentId: null,
    depreciationRatePercent: { toString: () => '12.50' },
    createdAt: new Date('2026-09-13T00:00:00.000Z'),
  }

  function repositoryWithSpies() {
    const findMany = jest.fn().mockResolvedValue([])
    const findUnique = jest.fn().mockResolvedValue(prismaCategory)
    const create = jest.fn().mockResolvedValue(prismaCategory)
    const update = jest.fn().mockResolvedValue(prismaCategory)
    const deleteCategory = jest.fn().mockResolvedValue(prismaCategory)
    const prisma = {
      inventoryCategory: {
        findMany,
        findUnique,
        create,
        update,
        delete: deleteCategory,
      },
    } as unknown as PrismaService

    return {
      repository: new PrismaCategoryRepository(prisma),
      findMany,
      findUnique,
      create,
      update,
      deleteCategory,
    }
  }

  it('searches code and name case-insensitively', async () => {
    const { repository, findMany } = repositoryWithSpies()

    await repository.findMany('electronics')

    expect(findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { code: { contains: 'electronics', mode: 'insensitive' } },
          { name: { contains: 'electronics', mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    })
  })

  it('orders category names ascending without a search term', async () => {
    const { repository, findMany } = repositoryWithSpies()

    await repository.findMany()

    expect(findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { name: 'asc' },
    })
  })

  it('finds a category by id and maps its database output', async () => {
    const { repository, findUnique } = repositoryWithSpies()

    await expect(repository.findById('category-1')).resolves.toEqual({
      id: 'category-1',
      code: 'CAT-001',
      name: 'Electronics',
      parentId: null,
      depreciationRatePercent: '12.50',
      createdAt: prismaCategory.createdAt,
    })
    expect(findUnique).toHaveBeenCalledWith({ where: { id: 'category-1' } })
  })

  it('maps create input and database output', async () => {
    const { repository, create } = repositoryWithSpies()

    await expect(
      repository.create({
        code: 'CAT-001',
        name: 'Electronics',
        depreciationRatePercent: 12.5,
      }),
    ).resolves.toMatchObject({ depreciationRatePercent: '12.50' })
    expect(create).toHaveBeenCalledWith({
      data: {
        code: 'CAT-001',
        name: 'Electronics',
        depreciationRatePercent: 12.5,
      },
    })
  })

  it('maps update input and database output', async () => {
    const { repository, update } = repositoryWithSpies()

    await expect(
      repository.update('category-1', { name: 'Updated electronics' }),
    ).resolves.toMatchObject({ depreciationRatePercent: '12.50' })
    expect(update).toHaveBeenCalledWith({
      where: { id: 'category-1' },
      data: {
        code: undefined,
        name: 'Updated electronics',
        depreciationRatePercent: undefined,
      },
    })
  })

  it('delegates delete and maps database output', async () => {
    const { repository, deleteCategory } = repositoryWithSpies()

    await expect(repository.delete('category-1')).resolves.toMatchObject({
      id: 'category-1',
      depreciationRatePercent: '12.50',
    })
    expect(deleteCategory).toHaveBeenCalledWith({
      where: { id: 'category-1' },
    })
  })
})
