import { ConflictException } from '@nestjs/common'
import { Prisma } from '../../generated/prisma/client.js'
import { SimpleListRepository } from './simple-list.repository.js'
import type { SimpleListDelegate } from './simple-list.types.js'

function delegate(overrides: Partial<SimpleListDelegate> = {}) {
  return {
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    update: jest.fn(),
    ...overrides,
  } as jest.Mocked<SimpleListDelegate>
}

const uniqueViolation = new Prisma.PrismaClientKnownRequestError(
  'Unique constraint failed',
  { code: 'P2002', clientVersion: 'test' },
)

describe('SimpleListRepository', () => {
  it('orders by sort order, then name, and leaves deleted rows out of a page', async () => {
    const d = delegate()
    const repository = new SimpleListRepository(d, 'Transportation')

    await repository.findPage({
      page: 2,
      limit: 5,
      search: 'oj',
      isActive: true,
    })

    expect(d.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        isActive: true,
        name: { contains: 'oj', mode: 'insensitive' },
      },
      skip: 5,
      take: 5,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
  })

  it('turns a unique violation on create into 409', async () => {
    const d = delegate({ create: jest.fn().mockRejectedValue(uniqueViolation) })
    const repository = new SimpleListRepository(d, 'Transportation')

    await expect(repository.create({ name: 'Ojek' })).rejects.toThrow(
      ConflictException,
    )
  })

  it('turns a unique violation on update into 409', async () => {
    const d = delegate({ update: jest.fn().mockRejectedValue(uniqueViolation) })
    const repository = new SimpleListRepository(d, 'Transportation')

    await expect(repository.update('id-1', { name: 'Ojek' })).rejects.toThrow(
      ConflictException,
    )
  })

  it('finds by ids without hiding deleted rows', async () => {
    const d = delegate()
    const repository = new SimpleListRepository(d, 'Transportation')

    await repository.findManyByIds(['a', 'b'])

    expect(d.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['a', 'b'] } },
    })
  })

  it('reads the active rows in display order', async () => {
    const d = delegate()
    const repository = new SimpleListRepository(d, 'Transportation')

    await repository.findActive()

    expect(d.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
  })
})
