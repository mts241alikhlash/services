import { ExecutionContext, INestApplication } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import type { Server } from 'node:http'
import { LoggerModule } from 'nestjs-pino'
import request from 'supertest'
import { PrismaModule } from '../src/core/database/prisma.module.js'
import { PrismaService } from '../src/core/database/prisma.service.js'
import { ResponseInterceptor } from '../src/core/interceptors/response.interceptor.js'
import { ReportCardModule } from '../src/report-card/report-card.module.js'
import { PermissionGuard } from '../src/platform/access-control/permission/index.js'
import { JwtAuthGuard } from '../src/platform/auth/index.js'

const CALLER_USER_ID = '11111111-1111-4111-8111-111111111111'
const CALLER_STUDENT_ID = '33333333-3333-4333-8333-333333333333'
const SOMEBODY_ELSE = '44444444-4444-4444-8444-444444444444'

let grantedPermissions: string[] = []

function authenticateAs(userId: string) {
  return {
    canActivate: (context: ExecutionContext) => {
      context.switchToHttp().getRequest<{ user: unknown }>().user = {
        id: userId,
        identifier: 'siswa',
        roles: [],
        permissions: grantedPermissions,
      }
      return true
    },
  }
}

interface PrismaWhere {
  isPublished?: boolean
  enrollment?: { studentId?: string; semesterId?: string }
}

describe('academic self-service (e2e)', () => {
  let app: INestApplication
  let server: Server

  const prismaMock = {
    student: { findFirst: jest.fn() },
    semester: {
      findFirst: jest.fn().mockResolvedValue({ id: 'sem-active' }),
    },
    reportCard: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
      aggregate: jest.fn().mockResolvedValue({ _avg: {} }),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  }

  function whereOfListQuery(): PrismaWhere {
    expect(prismaMock.reportCard.findMany).toHaveBeenCalled()
    const args = prismaMock.reportCard.findMany.mock.calls[0][0] as {
      where: PrismaWhere
    }
    return args.where
  }

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              JWT_SECRET: 'test-jwt-secret-for-e2e-testing-minimum-32-chars',
              NODE_ENV: 'test',
            }),
          ],
        }),
        LoggerModule.forRoot({ pinoHttp: { enabled: false } }),
        PrismaModule,
        ReportCardModule,
      ],
      providers: [
        { provide: APP_GUARD, useValue: authenticateAs(CALLER_USER_ID) },
        { provide: APP_GUARD, useClass: PermissionGuard },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideGuard(JwtAuthGuard)
      .useValue(authenticateAs(CALLER_USER_ID))
      .compile()

    app = moduleRef.createNestApplication()
    app.useGlobalInterceptors(new ResponseInterceptor())
    await app.init()
    server = app.getHttpServer() as Server
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    prismaMock.student.findFirst.mockResolvedValue({ id: CALLER_STUDENT_ID })
    prismaMock.semester.findFirst.mockResolvedValue({ id: 'sem-active' })
    prismaMock.reportCard.findMany.mockResolvedValue([])
    prismaMock.reportCard.count.mockResolvedValue(0)
    prismaMock.reportCard.aggregate.mockResolvedValue({ _avg: {} })
    grantedPermissions = ['report-cards.read-own']
  })

  describe('GET /rapors/me', () => {
    it('reads the caller and nobody else', async () => {
      await request(server).get('/rapors/me').expect(200)

      expect(whereOfListQuery().enrollment?.studentId).toBe(CALLER_STUDENT_ID)
    })

    it('ignores a studentId supplied by the caller', async () => {
      await request(server)
        .get('/rapors/me')
        .query({ studentId: SOMEBODY_ELSE })
        .expect(200)

      const where = whereOfListQuery()
      expect(where.enrollment?.studentId).toBe(CALLER_STUDENT_ID)
      expect(where.enrollment?.studentId).not.toBe(SOMEBODY_ELSE)
    })

    it('keeps the student scope alongside the semester fallback', async () => {
      await request(server).get('/rapors/me').expect(200)

      const enrollment = whereOfListQuery().enrollment
      expect(enrollment?.studentId).toBe(CALLER_STUDENT_ID)
      expect(enrollment?.semesterId).toBe('sem-active')
    })

    it('forces the published filter regardless of what was asked for', async () => {
      await request(server)
        .get('/rapors/me')
        .query({ isPublished: 'false' })
        .expect(200)

      expect(whereOfListQuery().isPublished).toBe(true)
    })

    it('answers empty for a caller who is not a student, without querying', async () => {
      prismaMock.student.findFirst.mockResolvedValue(null)

      await request(server).get('/rapors/me').expect(200)

      expect(prismaMock.reportCard.findMany).not.toHaveBeenCalled()
    })
  })

  describe('the permission is the boundary', () => {
    it('refuses the cohort route to a caller holding only read-own', async () => {
      grantedPermissions = ['report-cards.read-own']

      await request(server).get('/rapors').expect(403)
    })

    it('refuses the self-service route to a caller holding neither', async () => {
      grantedPermissions = []

      await request(server).get('/rapors/me').expect(403)
    })
  })
})
