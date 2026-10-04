import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  Controller,
  INestApplication,
  Post,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { MAX_UPLOAD_BYTES, UPLOAD_LIMITS } from './upload-limits.js'

@Controller('probe')
class UploadProbeController {
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: UPLOAD_LIMITS }))
  upload(): string {
    return 'stored'
  }
}

describe('UPLOAD_LIMITS', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UploadProbeController],
    }).compile()
    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(() => app.close())

  const upload = (bytes: number) =>
    request(app.getHttpServer())
      .post('/probe')
      .attach('file', Buffer.alloc(bytes), 'file.pdf')

  it('is 5 MB', () => {
    expect(MAX_UPLOAD_BYTES).toBe(5 * 1024 * 1024)
  })

  it('accepts a file of exactly 5 MB', async () => {
    await upload(MAX_UPLOAD_BYTES).expect(201)
  })

  it('rejects a file one byte over 5 MB with 413 before it is buffered', async () => {
    await upload(MAX_UPLOAD_BYTES + 1).expect(413)
  })

  it('is applied by every file interceptor in this service', () => {
    const unlimited = globSync('**/*.ts', { cwd: join(__dirname, '..', '..') })
      .filter((file) => !file.endsWith('.spec.ts'))
      .flatMap((file) => {
        const source = readFileSync(join(__dirname, '..', '..', file), 'utf8')
        return [...source.matchAll(/FileInterceptor\(([^)]*)\)/g)]
          .filter((call) => !call[1].includes('limits: UPLOAD_LIMITS'))
          .map(() => file)
      })

    expect(unlimited).toEqual([])
  })
})
