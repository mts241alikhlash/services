import { INestApplication, ValidationPipe } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { IRegionRepository } from '../../domain/repositories/region.repository.js'
import { RegionInternalController } from './region-internal.controller.js'

describe('RegionInternalController', () => {
  let app: INestApplication
  const findByCodes = jest
    .fn()
    .mockResolvedValue([
      { code: '32', name: 'JAWA BARAT', level: 'PROVINCE', parentCode: null },
    ])

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ PROVISIONING_SERVICE_TOKEN: 'secret' })],
        }),
      ],
      controllers: [RegionInternalController],
      providers: [{ provide: IRegionRepository, useValue: { findByCodes } }],
    }).compile()
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

  const post = (body: unknown, token?: string) => {
    const req = request(app.getHttpServer()).post('/regions/by-codes')
    if (token) req.set('x-provisioning-token', token)
    return req.send(body as object)
  }

  it('refuses a call without the provisioning token', async () => {
    await post({ codes: ['32'] }).expect(401)
  })

  it('refuses a malformed code', async () => {
    await post({ codes: ['32', 'x'] }, 'secret').expect(400)
  })

  it('refuses more than 50 codes', async () => {
    await post(
      { codes: Array.from({ length: 51 }, () => '32') },
      'secret',
    ).expect(400)
  })

  it('returns the regions for the codes', async () => {
    const res = await post({ codes: ['32'] }, 'secret').expect(200)
    expect(res.body).toEqual({
      data: [
        { code: '32', name: 'JAWA BARAT', level: 'PROVINCE', parentCode: null },
      ],
    })
  })
})
