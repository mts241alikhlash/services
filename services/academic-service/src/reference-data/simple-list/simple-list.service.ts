import { ConflictException, NotFoundException } from '@nestjs/common'
import type { PaginatedResponse } from '../../shared/domain/interfaces/repository.interface.js'
import type { SimpleListRepository } from './simple-list.repository.js'
import type {
  ISimpleListUsage,
  SimpleListCreate,
  SimpleListItem,
  SimpleListQuery,
  SimpleListUpdate,
} from './simple-list.types.js'

export class SimpleListService {
  constructor(
    private readonly repository: SimpleListRepository,
    private readonly label: string,
    private readonly usage?: ISimpleListUsage,
  ) {}

  async list(
    query: SimpleListQuery,
  ): Promise<PaginatedResponse<SimpleListItem>> {
    const { data, total, page, limit } = await this.repository.findPage(query)
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async get(id: string): Promise<SimpleListItem> {
    const row = await this.repository.findById(id)
    if (!row)
      throw new NotFoundException(`${this.label} with ID ${id} not found`)
    return row
  }

  async create(input: SimpleListCreate): Promise<SimpleListItem> {
    const name = input.name.trim()
    await this.assertNameFree(name)
    return this.repository.create({ ...input, name })
  }

  async update(id: string, input: SimpleListUpdate): Promise<SimpleListItem> {
    await this.get(id)
    const name = input.name?.trim()
    if (name !== undefined) await this.assertNameFree(name, id)
    return this.repository.update(id, { ...input, name })
  }

  async remove(id: string): Promise<void> {
    await this.get(id)
    const inUse = this.usage ? await this.usage.count(id) : 0
    if (inUse > 0) {
      throw new ConflictException(
        `${this.label} is used by ${inUse} record(s) and cannot be deleted`,
      )
    }
    await this.repository.softDelete(id)
  }

  byIds(ids: string[]): Promise<SimpleListItem[]> {
    if (ids.length === 0) return Promise.resolve([])
    return this.repository.findManyByIds(ids)
  }

  active(): Promise<SimpleListItem[]> {
    return this.repository.findActive()
  }

  summary(id: string): Promise<SimpleListItem | null> {
    return this.repository.findAnyById(id)
  }

  private async assertNameFree(name: string, excludeId?: string) {
    if (await this.repository.findByName(name, excludeId)) {
      throw new ConflictException(
        `${this.label} name "${name}" is already taken`,
      )
    }
  }
}
