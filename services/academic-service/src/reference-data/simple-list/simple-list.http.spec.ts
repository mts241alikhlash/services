import { INestApplication, ValidationPipe } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { JwtAuthGuard } from '../../platform/auth/index.js'
import { PERMISSIONS_KEY } from '../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { SIMPLE_LISTS } from '../lists.js'
import {
  SimpleListModule,
  simpleListRepositoryToken,
} from './simple-list.module.js'
import type { SimpleListItem } from './simple-list.types.js'

const TRANSPORTATIONS = SIMPLE_LISTS.find((l) => l.path === 'transportations')!

class InMemoryRepository {
  rows: SimpleListItem[] = []
  findPage() {
    const data = this.rows.filter((r) => !r.deletedAt)
    return Promise.resolve({ data, total: data.length, page: 1, limit: 10 })
  }
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
  findByName() {
    return Promise.resolve(null)
  }
  create(input: { name: string; sortOrder?: number; isActive?: boolean }) {
    const row = {
      id: '7f9c2d4e-1a2b-4c3d-8e9f-0a1b2c3d4e5f',
      name: input.name,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
      deletedAt: null,
    }
    this.rows.push(row)
    return Promise.resolve(row)
  }
  update(id: string, input: Partial<SimpleListItem>) {
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

describe('a simple reference list over HTTP', () => {
  let app: INestApplication
  const repository = new InMemoryRepository()

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ PROVISIONING_SERVICE_TOKEN: 'secret' })],
        }),
        SimpleListModule.forList(TRANSPORTATIONS),
      ],
    })
      .overrideProvider(simpleListRepositoryToken(TRANSPORTATIONS))
      .useValue(repository)
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile()
    app = moduleRef.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    await app.init()
  })

  afterAll(() => app.close())

  const http = () => request(app.getHttpServer())
  const id = '7f9c2d4e-1a2b-4c3d-8e9f-0a1b2c3d4e5f'

  it('refuses a sort order that is not a non-negative integer', async () => {
    await http()
      .post('/transportations')
      .send({ name: 'Ojek', sortOrder: 1.5 })
      .expect(400)
    await http()
      .post('/transportations')
      .send({ name: 'Ojek', sortOrder: -1 })
      .expect(400)
  })

  it('creates, reads, updates, pages and deletes a row', async () => {
    const created = await http()
      .post('/transportations')
      .send({ name: 'Ojek', sortOrder: 2 })
      .expect(201)
    expect(created.body).toEqual({
      id,
      name: 'Ojek',
      sortOrder: 2,
      isActive: true,
    })

    await http().get(`/transportations/${id}`).expect(200)
    const updated = await http()
      .patch(`/transportations/${id}`)
      .send({ isActive: false })
      .expect(200)
    expect(updated.body.isActive).toBe(false)

    const page = await http().get('/transportations').expect(200)
    expect(page.body.meta).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    })

    await http().delete(`/transportations/${id}`).expect(204)
  })

  it('resolves ids for another service only with the provisioning token', async () => {
    await http()
      .post('/transportations/by-ids')
      .send({ ids: [id] })
      .expect(401)
    const ids = Array.from({ length: 201 }, () => id)
    await http()
      .post('/transportations/by-ids')
      .set('x-provisioning-token', 'secret')
      .send({ ids })
      .expect(400)
    const res = await http()
      .post('/transportations/by-ids')
      .set('x-provisioning-token', 'secret')
      .send({ ids: [id] })
      .expect(200)
    expect(res.body).toEqual({ data: [{ id, name: 'Ojek', isActive: false }] })
  })

  it('serves the active rows to another service only with the provisioning token', async () => {
    await http().get('/transportations/active').expect(401)
    const res = await http()
      .get('/transportations/active')
      .set('x-provisioning-token', 'secret')
      .expect(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('names the permission each route requires', () => {
    const controller = app.get(SimpleListModule.controllerFor(TRANSPORTATIONS))
    const prototype = Object.getPrototypeOf(controller)
    const required = (method: string) =>
      Reflect.getMetadata(PERMISSIONS_KEY, prototype[method])
    expect(required('findAll')).toEqual(['transportations.read'])
    expect(required('findOne')).toEqual(['transportations.read'])
    expect(required('create')).toEqual(['transportations.create'])
    expect(required('update')).toEqual(['transportations.update'])
    expect(required('remove')).toEqual(['transportations.delete'])
  })

  it('reports a deleted row as inactive, so no form can pick it again', async () => {
    repository.rows.push({
      id: '3a1b2c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
      name: 'Delman',
      sortOrder: 9,
      isActive: true,
      deletedAt: new Date(),
    })

    const res = await http()
      .post('/transportations/by-ids')
      .set('x-provisioning-token', 'secret')
      .send({ ids: ['3a1b2c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'] })
      .expect(200)

    expect(res.body.data).toEqual([
      {
        id: '3a1b2c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
        name: 'Delman',
        isActive: false,
      },
    ])
  })
})
