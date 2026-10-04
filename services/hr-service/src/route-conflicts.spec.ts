process.env.DATABASE_URL ??= 'postgresql://routes:routes@localhost:5432/routes'
process.env.JWT_SECRET ??= 'routes-test-secret-not-a-real-key'
process.env.IDENTITY_SERVICE_URL ??= 'http://localhost:3000'
process.env.ACADEMIC_SERVICE_URL ??= 'http://localhost:3200'
process.env.PRESENCE_SERVICE_URL ??= 'http://localhost:3400'
process.env.PROVISIONING_SERVICE_TOKEN ??= 'routes-test-provisioning-token'

import { Test } from '@nestjs/testing'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module.js'
import { ROUTE_OPTIONS } from './core/config/route-options.js'

interface ExpressLayer {
  route?: { path: string; methods?: Record<string, boolean> }
}

interface RegisteredRoute {
  method: string
  segments: string[]
  path: string
}

function verbsOf(layer: ExpressLayer): string[] {
  const methods = layer.route?.methods ?? {}
  return Object.keys(methods).filter((verb) => methods[verb])
}

function swallows(generic: string[], specific: string[]): boolean {
  if (generic.length !== specific.length) return false
  return generic.every(
    (segment, i) => segment.startsWith(':') || segment === specific[i],
  )
}

function strictlyMoreGeneric(a: string[], b: string[]): boolean {
  if (!swallows(a, b)) return false
  return a.some(
    (segment, i) => segment.startsWith(':') && !b[i].startsWith(':'),
  )
}

describe('route registration', () => {
  let app: NestExpressApplication
  let routes: RegisteredRoute[]

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication<NestExpressApplication>({
      logger: false,
      ...ROUTE_OPTIONS,
    })

    await app.init()

    const router = app.getHttpAdapter().getInstance().router as {
      stack: ExpressLayer[]
    }

    routes = router.stack.flatMap((layer) => {
      const path = layer.route?.path
      if (path === undefined) return []
      const segments = path.split('/')
      return verbsOf(layer).map((method) => ({ method, segments, path }))
    })
  }, 120_000)

  afterAll(async () => {
    await app.close()
  })

  it('boots the HTTP router, which refuses a duplicate route', () => {
    expect(routes.length).toBeGreaterThan(40)
  })

  it('is configured to resolve by specificity and refuse duplicates', () => {
    expect(ROUTE_OPTIONS.routeResolutionStrategy).toBe('specificity')
    expect(ROUTE_OPTIONS.routeConflictPolicy.duplicate).toBe('error')
  })

  it('never registers a parameter ahead of a literal it would swallow', () => {
    const shadowed: string[] = []

    for (let i = 0; i < routes.length; i++) {
      for (let j = i + 1; j < routes.length; j++) {
        const first = routes[i]
        const later = routes[j]
        if (first.method !== later.method) continue
        if (!strictlyMoreGeneric(first.segments, later.segments)) continue

        shadowed.push(
          `${first.method.toUpperCase()} ${first.path} is registered before ${later.path} and swallows it`,
        )
      }
    }

    expect(shadowed.sort()).toEqual([])
  })
})
