import type { PrismaService } from '../../../../../../core/database/prisma.service.js'
import { PrismaFundingSourceRepository } from './prisma-funding-source.repository.js'

describe('PrismaFundingSourceRepository', () => {
  const prismaFundingSource = {
    id: 'funding-source-1',
    code: 'FUND-GOV',
    name: 'APBD',
    description: 'Anggaran pendapatan dan belanja daerah',
    createdAt: new Date('2026-09-13T00:00:00.000Z'),
    legacyField: 'must not escape adapter',
  }

  function repositoryWithSpies() {
    const findMany = jest.fn().mockResolvedValue([prismaFundingSource])
    const findUnique = jest.fn().mockResolvedValue(prismaFundingSource)
    const create = jest.fn().mockResolvedValue(prismaFundingSource)
    const update = jest.fn().mockResolvedValue(prismaFundingSource)
    const deleteFundingSource = jest.fn().mockResolvedValue(prismaFundingSource)
    const prisma = {
      inventoryFundingSource: {
        findMany,
        findUnique,
        create,
        update,
        delete: deleteFundingSource,
      },
    } as unknown as PrismaService

    return {
      repository: new PrismaFundingSourceRepository(prisma),
      findMany,
      findUnique,
      create,
      update,
      deleteFundingSource,
    }
  }

  it('searches code and name case-insensitively and orders names ascending', async () => {
    const { repository, findMany } = repositoryWithSpies()

    await repository.findMany('ap')

    expect(findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { code: { contains: 'ap', mode: 'insensitive' } },
          { name: { contains: 'ap', mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    })
  })

  it('orders funding source names ascending without a search term', async () => {
    const { repository, findMany } = repositoryWithSpies()

    await repository.findMany()

    expect(findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { name: 'asc' },
    })
  })

  it('maps list results to the repository output shape', async () => {
    const { repository } = repositoryWithSpies()

    await expect(repository.findMany()).resolves.toEqual([
      {
        id: 'funding-source-1',
        code: 'FUND-GOV',
        name: 'APBD',
        description: 'Anggaran pendapatan dan belanja daerah',
        createdAt: prismaFundingSource.createdAt,
      },
    ])
  })

  it('finds a funding source by id and maps its database output', async () => {
    const { repository, findUnique } = repositoryWithSpies()

    const output = await repository.findById('funding-source-1')
    expect(output).not.toBeNull()
    if (!output) {
      throw new Error('Funding source lookup unexpectedly returned null')
    }

    expect(output).toEqual({
      id: 'funding-source-1',
      code: 'FUND-GOV',
      name: 'APBD',
      description: 'Anggaran pendapatan dan belanja daerah',
      createdAt: prismaFundingSource.createdAt,
    })
    expect(output.description).toBe('Anggaran pendapatan dan belanja daerah')
    expect(output.createdAt).toBe(prismaFundingSource.createdAt)
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'funding-source-1' },
    })
  })

  it('returns null when funding source lookup finds no row', async () => {
    const { repository, findUnique } = repositoryWithSpies()
    findUnique.mockResolvedValue(null)

    await expect(repository.findById('missing')).resolves.toBeNull()
    expect(findUnique).toHaveBeenCalledWith({ where: { id: 'missing' } })
  })

  it('maps create input and database output explicitly', async () => {
    const { repository, create } = repositoryWithSpies()

    await expect(
      repository.create({
        code: 'FUND-SCHOOL',
        name: 'BOS',
        description: null,
      }),
    ).resolves.toEqual({
      id: 'funding-source-1',
      code: 'FUND-GOV',
      name: 'APBD',
      description: 'Anggaran pendapatan dan belanja daerah',
      createdAt: prismaFundingSource.createdAt,
    })
    expect(create).toHaveBeenCalledWith({
      data: {
        code: 'FUND-SCHOOL',
        name: 'BOS',
        description: null,
      },
    })
  })

  it('maps update input and database output explicitly', async () => {
    const { repository, update } = repositoryWithSpies()

    await expect(
      repository.update('funding-source-1', {
        name: 'BOS',
        description: 'Bantuan operasional sekolah',
      }),
    ).resolves.toEqual({
      id: 'funding-source-1',
      code: 'FUND-GOV',
      name: 'APBD',
      description: 'Anggaran pendapatan dan belanja daerah',
      createdAt: prismaFundingSource.createdAt,
    })
    expect(update).toHaveBeenCalledWith({
      where: { id: 'funding-source-1' },
      data: {
        code: undefined,
        name: 'BOS',
        description: 'Bantuan operasional sekolah',
      },
    })
  })

  it('deletes by id and maps database output', async () => {
    const { repository, deleteFundingSource } = repositoryWithSpies()

    await expect(repository.delete('funding-source-1')).resolves.toEqual({
      id: 'funding-source-1',
      code: 'FUND-GOV',
      name: 'APBD',
      description: 'Anggaran pendapatan dan belanja daerah',
      createdAt: prismaFundingSource.createdAt,
    })
    expect(deleteFundingSource).toHaveBeenCalledWith({
      where: { id: 'funding-source-1' },
    })
  })

  it('propagates Prisma errors from list queries', async () => {
    const { repository, findMany } = repositoryWithSpies()
    const error = new Error('database unavailable')
    findMany.mockRejectedValue(error)

    await expect(repository.findMany()).rejects.toBe(error)
  })

  it('propagates Prisma errors from lookup and mutations', async () => {
    const { repository, findUnique, create, update, deleteFundingSource } =
      repositoryWithSpies()
    const error = new Error('database unavailable')

    findUnique.mockRejectedValue(error)
    create.mockRejectedValue(error)
    update.mockRejectedValue(error)
    deleteFundingSource.mockRejectedValue(error)

    await expect(repository.findById('funding-source-1')).rejects.toBe(error)
    await expect(
      repository.create({ code: 'FUND-GOV', name: 'APBD' }),
    ).rejects.toBe(error)
    await expect(
      repository.update('funding-source-1', { name: 'BOS' }),
    ).rejects.toBe(error)
    await expect(repository.delete('funding-source-1')).rejects.toBe(error)
  })
})
