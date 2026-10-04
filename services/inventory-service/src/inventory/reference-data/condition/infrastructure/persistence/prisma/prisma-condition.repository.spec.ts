import type { PrismaService } from '../../../../../../core/database/prisma.service.js'
import { PrismaConditionRepository } from './prisma-condition.repository.js'

describe('PrismaConditionRepository', () => {
  const prismaCondition = {
    id: 'condition-1',
    code: 'COND-GOOD',
    name: 'Baik',
    isUsable: true,
    createdAt: new Date('2026-09-13T00:00:00.000Z'),
  }

  function repositoryWithSpies() {
    const findMany = jest.fn().mockResolvedValue([])
    const findUnique = jest.fn().mockResolvedValue(prismaCondition)
    const create = jest.fn().mockResolvedValue(prismaCondition)
    const update = jest.fn().mockResolvedValue(prismaCondition)
    const deleteCondition = jest.fn().mockResolvedValue(prismaCondition)
    const prisma = {
      inventoryCondition: {
        findMany,
        findUnique,
        create,
        update,
        delete: deleteCondition,
      },
    } as unknown as PrismaService

    return {
      repository: new PrismaConditionRepository(prisma),
      findMany,
      findUnique,
      create,
      update,
      deleteCondition,
    }
  }

  it('searches code and name case-insensitively', async () => {
    const { repository, findMany } = repositoryWithSpies()

    await repository.findMany('baik')

    expect(findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { code: { contains: 'baik', mode: 'insensitive' } },
          { name: { contains: 'baik', mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    })
  })

  it('orders condition names ascending without a search term', async () => {
    const { repository, findMany } = repositoryWithSpies()

    await repository.findMany()

    expect(findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { name: 'asc' },
    })
  })

  it('finds a condition by id and maps database output', async () => {
    const { repository, findUnique } = repositoryWithSpies()

    await expect(repository.findById('condition-1')).resolves.toEqual(
      prismaCondition,
    )
    expect(findUnique).toHaveBeenCalledWith({ where: { id: 'condition-1' } })
  })

  it('maps create input and database output', async () => {
    const { repository, create } = repositoryWithSpies()

    await expect(
      repository.create({
        code: 'COND-GOOD',
        name: 'Baik',
        isUsable: true,
      }),
    ).resolves.toEqual(prismaCondition)
    expect(create).toHaveBeenCalledWith({
      data: {
        code: 'COND-GOOD',
        name: 'Baik',
        isUsable: true,
      },
    })
  })

  it('maps update input and database output', async () => {
    const { repository, update } = repositoryWithSpies()

    await expect(
      repository.update('condition-1', { name: 'Rusak' }),
    ).resolves.toEqual(prismaCondition)
    expect(update).toHaveBeenCalledWith({
      where: { id: 'condition-1' },
      data: { code: undefined, name: 'Rusak', isUsable: undefined },
    })
  })

  it('delegates delete and maps database output', async () => {
    const { repository, deleteCondition } = repositoryWithSpies()

    await expect(repository.delete('condition-1')).resolves.toEqual(
      prismaCondition,
    )
    expect(deleteCondition).toHaveBeenCalledWith({
      where: { id: 'condition-1' },
    })
  })
})
