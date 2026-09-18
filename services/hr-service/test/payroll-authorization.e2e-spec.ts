import { ExecutionContext, INestApplication } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import type { Server } from 'node:http'
import { LoggerModule } from 'nestjs-pino'
import request from 'supertest'
import { PrismaModule } from '../src/core/database/prisma.module.js'
import { PrismaService } from '../src/core/database/prisma.service.js'
import { PayrollModule } from '../src/payroll/payroll.module.js'
import { PermissionGuard } from '../src/platform/access-control/permission/guards/permission.guard.js'
import { JwtAuthGuard } from '../src/platform/auth/guards/jwt-auth.guard.js'

const ADMIN_ID = '11111111-1111-4111-8111-111111111111'
const UUID = '22222222-2222-4222-8222-222222222222'

interface Route {
  method: 'get' | 'post' | 'patch' | 'delete'
  path: string
  permission: string
}

const ROUTES: Route[] = [
  {
    method: 'get',
    path: '/payroll/components',
    permission: 'payroll-components.read',
  },
  {
    method: 'post',
    path: '/payroll/components',
    permission: 'payroll-components.create',
  },
  {
    method: 'patch',
    path: `/payroll/components/${UUID}`,
    permission: 'payroll-components.update',
  },
  {
    method: 'delete',
    path: `/payroll/components/${UUID}`,
    permission: 'payroll-components.delete',
  },
  {
    method: 'get',
    path: '/payroll/assignments',
    permission: 'payroll-salaries.read',
  },
  {
    method: 'get',
    path: `/payroll/assignments/user/${UUID}`,
    permission: 'payroll-salaries.read',
  },
  {
    method: 'post',
    path: '/payroll/assignments',
    permission: 'payroll-salaries.update',
  },
  {
    method: 'delete',
    path: `/payroll/assignments/${UUID}`,
    permission: 'payroll-salaries.update',
  },
  { method: 'get', path: '/payroll/runs', permission: 'payroll-runs.read' },
  {
    method: 'get',
    path: `/payroll/runs/${UUID}`,
    permission: 'payroll-runs.read',
  },
  { method: 'post', path: '/payroll/runs', permission: 'payroll-runs.create' },
  {
    method: 'post',
    path: `/payroll/runs/${UUID}/recalculate`,
    permission: 'payroll-runs.update',
  },
  {
    method: 'post',
    path: `/payroll/runs/${UUID}/submit`,
    permission: 'payroll-runs.update',
  },
  {
    method: 'post',
    path: `/payroll/runs/${UUID}/approve`,
    permission: 'payroll-runs.approve',
  },
  {
    method: 'get',
    path: `/payroll/runs/${UUID}/payslips`,
    permission: 'payroll-payslips.read',
  },
  {
    method: 'get',
    path: '/payroll/payslips/me',
    permission: 'payroll-payslips.read-own',
  },
  {
    method: 'get',
    path: `/payroll/payslips/${UUID}`,
    permission: 'payroll-payslips.read',
  },
]

describe('payroll authorization (ADR-0008)', () => {
  let app: INestApplication
  let server: Server

  let grantedPermissions: string[] = []
  let roleCodes = ['ADMIN']

  function authenticateAs(userId: string) {
    return {
      canActivate: (context: ExecutionContext) => {
        context.switchToHttp().getRequest<{ user: unknown }>().user = {
          id: userId,
          identifier: 'admin',
          roles: roleCodes,
          permissions: grantedPermissions,
        }
        return true
      },
    }
  }

  const prismaMock = {
    salaryComponent: { findMany: jest.fn().mockResolvedValue([]) },
    salaryAssignment: { findMany: jest.fn().mockResolvedValue([]) },
    payrollRun: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
    },
    payslip: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
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
        PayrollModule,
      ],
      providers: [
        { provide: APP_GUARD, useValue: authenticateAs(ADMIN_ID) },
        { provide: APP_GUARD, useClass: PermissionGuard },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideGuard(JwtAuthGuard)
      .useValue(authenticateAs(ADMIN_ID))
      .compile()

    app = moduleRef.createNestApplication()
    await app.init()
    server = app.getHttpServer() as Server
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    grantedPermissions = []
    roleCodes = ['ADMIN']
  })

  describe.each(ROUTES)('$method $path', (route) => {
    it(`denies an ADMIN with no explicit ${route.permission}`, async () => {
      const response = await request(server)[route.method](route.path).send({})

      expect(response.status).toBe(403)
    })

    it(`admits the same account once ${route.permission} is granted`, async () => {
      grantedPermissions = [route.permission]

      const response = await request(server)[route.method](route.path).send({})

      expect(response.status).not.toBe(403)
    })
  })

  it('lets SUPER_ADMIN through without an explicit grant', async () => {
    roleCodes = ['SUPER_ADMIN']

    const response = await request(server).get('/payroll/components')

    expect(response.status).not.toBe(403)
  })

  it('denies an account holding no role at all', async () => {
    roleCodes = []

    const response = await request(server).get('/payroll/components')

    expect(response.status).toBe(403)
  })
})
