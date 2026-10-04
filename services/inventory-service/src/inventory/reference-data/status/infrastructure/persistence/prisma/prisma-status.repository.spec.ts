import type { PrismaService } from '../../../../../../core/database/prisma.service.js'
import { InventoryStatusKey } from '../../../../../../shared/domain/enums/inventory-status-key.enum.js'
import { PrismaStatusRepository } from './prisma-status.repository.js'

describe('PrismaStatusRepository', () => {
  const prismaStatus = {
    id: 'status-1',
    code: 'STATUS-AVAILABLE',
    name: 'Available',
    allowTransactions: true,
    systemKey: 'AVAILABLE',
    createdAt: new Date('2026-09-14T00:00:00.000Z'),
    legacyField: 'must not escape adapter',
  }

  function repositoryWithSpies() {
    const findMany = jest.fn().mockResolvedValue([prismaStatus])
    const findUnique = jest.fn().mockResolvedValue(prismaStatus)
    const create = jest.fn().mockResolvedValue(prismaStatus)
    const update = jest.fn().mockResolvedValue(prismaStatus)
    const deleteStatus = jest.fn().mockResolvedValue(prismaStatus)
    const prisma = {
      inventoryStatus: {
        findMany,
        findUnique,
        create,
        update,
        delete: deleteStatus,
      },
    } as unknown as PrismaService

    return {
      repository: new PrismaStatusRepository(prisma),
      findMany,
      findUnique,
      create,
      update,
      deleteStatus,
    }
  }

  it('searches code and name case-insensitively and orders names ascending', async () => {
    const { repository, findMany } = repositoryWithSpies()

    await repository.findMany('avail')

    expect(findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { code: { contains: 'avail', mode: 'insensitive' } },
          { name: { contains: 'avail', mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    })
  })

  it('maps enum inputs and persisted fields explicitly', async () => {
    const { repository, create, update } = repositoryWithSpies()

    await repository.create({
      code: 'STATUS-AVAILABLE',
      name: 'Available',
      allowTransactions: false,
      systemKey: InventoryStatusKey.AVAILABLE,
    })
    await repository.update('status-1', {
      code: 'STATUS-LOANED',
      name: 'Loaned',
      allowTransactions: true,
      systemKey: null,
    })

    expect(create).toHaveBeenCalledWith({
      data: {
        code: 'STATUS-AVAILABLE',
        name: 'Available',
        allowTransactions: false,
        systemKey: 'AVAILABLE',
      },
    })
    expect(update).toHaveBeenCalledWith({
      where: { id: 'status-1' },
      data: {
        code: 'STATUS-LOANED',
        name: 'Loaned',
        allowTransactions: true,
        systemKey: null,
      },
    })
  })

  it('returns null when id lookup finds no row', async () => {
    const { repository, findUnique } = repositoryWithSpies()
    findUnique.mockResolvedValue(null)

    await expect(repository.findById('missing')).resolves.toBeNull()
  })

  it('returns IDs for statuses that allow transactions', async () => {
    const { repository, findMany } = repositoryWithSpies()

    await expect(repository.findIdsAllowingTransactions()).resolves.toEqual([
      'status-1',
    ])
    expect(findMany).toHaveBeenCalledWith({
      where: { allowTransactions: true },
      select: { id: true },
    })
  })

  it('maps every Prisma system key to its domain enum', async () => {
    const { repository, findUnique } = repositoryWithSpies()
    const keys = Object.values(InventoryStatusKey)

    for (const key of keys) {
      findUnique.mockResolvedValueOnce({ ...prismaStatus, systemKey: key })
      await expect(repository.findById(`status-${key}`)).resolves.toEqual({
        id: prismaStatus.id,
        code: prismaStatus.code,
        name: prismaStatus.name,
        allowTransactions: prismaStatus.allowTransactions,
        systemKey: key,
        createdAt: prismaStatus.createdAt,
      })
    }
  })

  it('propagates database errors from lookup and mutations', async () => {
    const { repository, findUnique, create, update, deleteStatus } =
      repositoryWithSpies()
    const error = new Error('database unavailable')

    findUnique.mockRejectedValue(error)
    create.mockRejectedValue(error)
    update.mockRejectedValue(error)
    deleteStatus.mockRejectedValue(error)

    await expect(repository.findById('status-1')).rejects.toBe(error)
    await expect(
      repository.create({ code: 'STATUS-A', name: 'Active' }),
    ).rejects.toBe(error)
    await expect(
      repository.update('status-1', { name: 'Active' }),
    ).rejects.toBe(error)
    await expect(repository.delete('status-1')).rejects.toBe(error)
  })
})
