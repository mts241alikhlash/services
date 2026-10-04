import { INestApplication, ValidationPipe } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import * as bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser'
import type { Server } from 'node:http'
import request from 'supertest'
import { PrismaModule } from '../src/core/database/prisma.module.js'
import { PrismaService } from '../src/core/database/prisma.service.js'
import { ResponseInterceptor } from '../src/core/interceptors/response.interceptor.js'
import { AuthModule } from '../src/auth/auth.module.js'

const TEST_JWT_SECRET = 'test-jwt-secret-for-e2e-testing-minimum-32-chars'
const VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
const CHALLENGE = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
const HR_CALLBACK = 'http://localhost:5177/oauth/callback'

function getCookies(res: request.Response): string[] {
  const raw = res.headers['set-cookie']
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
}

function authorizeQuery(overrides: Record<string, string> = {}) {
  return {
    app: 'hr',
    redirect_uri: HR_CALLBACK,
    code_challenge: CHALLENGE,
    code_challenge_method: 'S256',
    state: 'state-0123456789abcdef',
    ...overrides,
  }
}

describe('SSO (e2e)', () => {
  let app: INestApplication
  let httpServer: Server
  let passwordHash: string

  const sessions = new Map<string, Record<string, unknown>>()
  const codes = new Map<string, Record<string, unknown>>()
  const user = {
    id: 'b3d7f1a0-1234-4abc-9def-000000000001',
    identifier: 'guru',
    isActive: true,
    deletedAt: null,
  }

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    userRole: {
      findMany: jest.fn().mockResolvedValue([
        {
          role: {
            code: 'STAFF',
            rolePermissions: [{ permission: { code: 'presence-scans.read' } }],
          },
        },
      ]),
    },
    authSession: {
      create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
        sessions.set(data.id as string, { ...data, revokedAt: null })
        return Promise.resolve(data)
      }),
      findFirst: jest.fn(({ where }: { where: { tokenHash: string } }) => {
        const row = [...sessions.values()].find(
          (session) => session.tokenHash === where.tokenHash,
        )
        return Promise.resolve(row ? { ...row, user, parent: null } : null)
      }),
      findUnique: jest.fn(({ where }: { where: { id: string } }) => {
        const row = sessions.get(where.id)
        if (!row) return Promise.resolve(null)
        const parent = row.parentSessionId
          ? (sessions.get(row.parentSessionId as string) ?? null)
          : null
        return Promise.resolve({ ...row, user, parent })
      }),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      deleteMany: jest.fn(),
    },
    ssoAuthorizationCode: {
      create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
        const row = {
          ...data,
          id: `code-${codes.size}`,
          usedAt: null,
          childSessionId: null,
        }
        codes.set(data.codeHash as string, row)
        return Promise.resolve(row)
      }),
      findUnique: jest.fn(({ where }: { where: { codeHash: string } }) =>
        Promise.resolve(codes.get(where.codeHash) ?? null),
      ),
      updateMany: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: string }
          data: Record<string, unknown>
        }) => {
          const row = [...codes.values()].find((code) => code.id === where.id)
          if (!row || row.usedAt) return Promise.resolve({ count: 0 })
          Object.assign(row, data)
          return Promise.resolve({ count: 1 })
        },
      ),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  }

  beforeAll(async () => {
    passwordHash = await bcrypt.hash('password123', 10)
    mockPrismaService.user.findFirst.mockResolvedValue({
      ...user,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
      userRoles: [{ role: { code: 'STAFF' } }],
    })

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              NODE_ENV: 'test',
              JWT_SECRET: TEST_JWT_SECRET,
              JWT_ACCESS_EXPIRATION: '15m',
              JWT_REFRESH_EXPIRATION: '7d',
              FRONTEND_URL: 'http://localhost:5173',
              SSO_ACCOUNTS_ORIGIN: 'http://localhost:5180',
              SSO_APPS: `account=http://localhost:5180/oauth/callback,hr=${HR_CALLBACK}`,
              SSO_ABSOLUTE_SESSION_DAYS: 30,
              GOOGLE_CLIENT_ID: 'test',
              GOOGLE_CLIENT_SECRET: 'test',
              GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
              GOOGLE_OAUTH_SUCCESS_REDIRECT_URL:
                'http://localhost:5175/oauth/callback',
              GOOGLE_OAUTH_REDIRECT_ALLOWLIST: 'http://localhost:5175',
              DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
            }),
          ],
        }),
        PrismaModule,
        AuthModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile()

    app = moduleRef.createNestApplication()
    app.use(cookieParser())
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    app.useGlobalInterceptors(new ResponseInterceptor())
    await app.init()
    httpServer = app.getHttpServer() as Server
  })

  afterAll(async () => {
    if (app) await app.close()
  })

  it('signs in once and trades a code for an app session, once', async () => {
    const login = await request(httpServer)
      .post('/sso/login')
      .set('Origin', 'http://localhost:5180')
      .send({ identifier: 'guru', password: 'password123' })
      .expect(204)
    const central = getCookies(login).find((c) => c.startsWith('sso_session='))
    expect(central).toBeDefined()

    const authorize = await request(httpServer)
      .get('/sso/authorize')
      .query(authorizeQuery())
      .set('Cookie', [central!.split(';')[0]])
      .expect(302)
    const location = new URL(authorize.headers.location)
    expect(location.origin).toBe('http://localhost:5177')
    const code = location.searchParams.get('code')!

    const exchange = await request(httpServer)
      .post('/sso/exchange')
      .set('Origin', 'http://localhost:5173')
      .send({ code, code_verifier: VERIFIER, redirect_uri: HR_CALLBACK })
      .expect(200)
    expect(
      (exchange.body as { data: { accessToken: string } }).data.accessToken,
    ).toBeDefined()
    expect(
      getCookies(exchange).some((c) => c.startsWith('refresh_token=')),
    ).toBe(true)

    await request(httpServer)
      .post('/sso/exchange')
      .set('Origin', 'http://localhost:5173')
      .send({ code, code_verifier: VERIFIER, redirect_uri: HR_CALLBACK })
      .expect(400)
  })

  it('sends an unauthenticated browser to the accounts login page', async () => {
    const res = await request(httpServer)
      .get('/sso/authorize')
      .query(authorizeQuery())
      .expect(302)
    expect(res.headers.location).toMatch(
      /^http:\/\/localhost:5180\/login\?continue=%2Fsso%2Fauthorize/,
    )
  })

  it('refuses an unregistered redirect URI without redirecting', async () => {
    await request(httpServer)
      .get('/sso/authorize')
      .query(
        authorizeQuery({ redirect_uri: 'http://evil.test/oauth/callback' }),
      )
      .expect(400)
  })

  it.each(['//evil.test', 'https://evil.test'])(
    'keeps /sso/accounts on accounts for path %s',
    async (path) => {
      const res = await request(httpServer)
        .get('/sso/accounts')
        .query({ path })
        .expect(302)
      expect(res.headers.location).toBe('http://localhost:5180/')
    },
  )
})
