import { ConflictException } from '@nestjs/common'
import { Prisma } from '../../generated/prisma/client.js'
import type { PaginatedResult } from '../../shared/domain/interfaces/repository.interface.js'
import type {
  SimpleListCreate,
  SimpleListDelegate,
  SimpleListItem,
  SimpleListQuery,
  SimpleListUpdate,
} from './simple-list.types.js'

export class SimpleListRepository {
  constructor(
    private readonly delegate: SimpleListDelegate,
    private readonly label: string,
  ) {}

  async findPage(
    query: SimpleListQuery,
  ): Promise<PaginatedResult<SimpleListItem>> {
    const { page, limit, search, isActive } = query
    const where = {
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    }
    const [data, total] = await Promise.all([
      this.delegate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.delegate.count({ where }),
    ])
    return { data, total, page, limit }
  }

  findById(id: string): Promise<SimpleListItem | null> {
    return this.delegate.findFirst({ where: { id, deletedAt: null } })
  }

  findAnyById(id: string): Promise<SimpleListItem | null> {
    return this.delegate.findFirst({ where: { id } })
  }

  findManyByIds(ids: string[]): Promise<SimpleListItem[]> {
    return this.delegate.findMany({ where: { id: { in: ids } } })
  }

  findActive(): Promise<SimpleListItem[]> {
    return this.delegate.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
  }

  findByName(name: string, excludeId?: string): Promise<SimpleListItem | null> {
    return this.delegate.findFirst({
      where: {
        deletedAt: null,
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    })
  }

  create(input: SimpleListCreate): Promise<SimpleListItem> {
    return this.unique(input.name, () => this.delegate.create({ data: input }))
  }

  update(id: string, input: SimpleListUpdate): Promise<SimpleListItem> {
    return this.unique(input.name, () =>
      this.delegate.update({ where: { id }, data: input }),
    )
  }

  async softDelete(id: string): Promise<void> {
    await this.delegate.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  private async unique<T>(
    name: string | undefined,
    write: () => Promise<T>,
  ): Promise<T> {
    try {
      return await write()
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `${this.label} name "${name}" is already taken`,
        )
      }
      throw error
    }
  }
}
