import { ConflictException, NotFoundException } from '@nestjs/common'
import { SimpleListService } from './simple-list.service.js'
import { SimpleListRepository } from './simple-list.repository.js'
import type {
  ISimpleListUsage,
  SimpleListCreate,
  SimpleListItem,
  SimpleListUpdate,
} from './simple-list.types.js'

class InMemoryRepository {
  rows: SimpleListItem[] = []
  private next = 1

  findById(id: string) {
    return Promise.resolve(
      this.rows.find((r) => r.id === id && !r.deletedAt) ?? null,
    )
  }

  findAnyById(id: string) {
    return Promise.resolve(this.rows.find((r) => r.id === id) ?? null)
  }

  findManyByIds(ids: string[]) {
    return Promise.resolve(this.rows.filter((r) => ids.includes(r.id)))
  }

  findActive() {
    return Promise.resolve(this.rows.filter((r) => !r.deletedAt && r.isActive))
  }

  findByName(name: string, excludeId?: string) {
    return Promise.resolve(
      this.rows.find(
        (r) =>
          !r.deletedAt &&
          r.id !== excludeId &&
          r.name.toLowerCase() === name.toLowerCase(),
      ) ?? null,
    )
  }

  findPage() {
    const data = this.rows.filter((r) => !r.deletedAt)
    return Promise.resolve({ data, total: data.length, page: 1, limit: 10 })
  }

  create(input: SimpleListCreate) {
    const row: SimpleListItem = {
      id: `id-${this.next++}`,
      name: input.name,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
      deletedAt: null,
    }
    this.rows.push(row)
    return Promise.resolve(row)
  }

  update(id: string, input: SimpleListUpdate) {
    const row = this.rows.find((r) => r.id === id)!
    Object.assign(
      row,
      Object.fromEntries(
        Object.entries(input).filter(([, v]) => v !== undefined),
      ),
    )
    return Promise.resolve(row)
  }

  softDelete(id: string) {
    this.rows.find((r) => r.id === id)!.deletedAt = new Date()
    return Promise.resolve()
  }
}

function build(usage?: ISimpleListUsage) {
  const repository = new InMemoryRepository()
  const service = new SimpleListService(
    repository as unknown as SimpleListRepository,
    'Transportation',
    usage,
  )
  return { repository, service }
}

describe('SimpleListService', () => {
  it('trims the name it stores', async () => {
    const { service } = build()

    const created = await service.create({ name: '  Ojek  ' })

    expect(created.name).toBe('Ojek')
  })

  it('refuses a name that differs only by case or surrounding spaces', async () => {
    const { service } = build()
    await service.create({ name: 'Ojek' })

    await expect(service.create({ name: ' ojek ' })).rejects.toThrow(
      ConflictException,
    )
  })

  it('accepts a row keeping its own name and refuses taking another row name', async () => {
    const { service } = build()
    const ojek = await service.create({ name: 'Ojek' })
    await service.create({ name: 'Sepeda' })

    await expect(
      service.update(ojek.id, { name: 'OJEK', sortOrder: 2 }),
    ).resolves.toMatchObject({ name: 'OJEK', sortOrder: 2 })
    await expect(service.update(ojek.id, { name: 'sepeda' })).rejects.toThrow(
      ConflictException,
    )
  })

  it('answers 404 for a row that does not exist or was deleted', async () => {
    const { service } = build()
    const row = await service.create({ name: 'Ojek' })
    await service.remove(row.id)

    await expect(service.get(row.id)).rejects.toThrow(NotFoundException)
    await expect(service.update(row.id, { name: 'x' })).rejects.toThrow(
      NotFoundException,
    )
    await expect(service.remove('missing')).rejects.toThrow(NotFoundException)
  })

  it('lets a deleted name be created again', async () => {
    const { service } = build()
    const row = await service.create({ name: 'Ojek' })
    await service.remove(row.id)

    await expect(service.create({ name: 'Ojek' })).resolves.toMatchObject({
      name: 'Ojek',
    })
  })

  it('refuses to delete a row still in use', async () => {
    const usage = { count: jest.fn().mockResolvedValue(3) }
    const { service, repository } = build(usage)
    const row = await service.create({ name: 'Petani' })

    await expect(service.remove(row.id)).rejects.toThrow(ConflictException)
    expect(usage.count).toHaveBeenCalledWith(row.id)
    expect(repository.rows[0].deletedAt).toBeNull()
  })

  it('still resolves a deleted row by id, so a record pointing at it keeps its name', async () => {
    const { service } = build()
    const row = await service.create({ name: 'Ojek' })
    await service.remove(row.id)

    await expect(service.byIds([row.id])).resolves.toMatchObject([
      { id: row.id, name: 'Ojek' },
    ])
    await expect(service.summary(row.id)).resolves.toMatchObject({
      name: 'Ojek',
    })
  })

  it('pages the rows with the total page count', async () => {
    const { service } = build()
    await service.create({ name: 'Ojek' })

    const page = await service.list({ page: 1, limit: 10 })

    expect(page.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 })
  })

  it('lists only active rows for a form', async () => {
    const { service } = build()
    await service.create({ name: 'Ojek' })
    const hidden = await service.create({ name: 'Delman', isActive: false })

    const rows = await service.active()

    expect(rows.map((r) => r.name)).toEqual(['Ojek'])
    expect(rows.find((r) => r.id === hidden.id)).toBeUndefined()
  })
})
