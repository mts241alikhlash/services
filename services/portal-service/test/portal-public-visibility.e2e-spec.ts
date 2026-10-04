import { INestApplication, ValidationPipe } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import type { Server } from 'node:http'
import request from 'supertest'
import { AppCacheModule } from '../src/core/cache/cache.module.js'
import { PrismaModule } from '../src/core/database/prisma.module.js'
import { PrismaService } from '../src/core/database/prisma.service.js'
import { ResponseInterceptor } from '../src/core/interceptors/response.interceptor.js'
import { StorageModule } from '../src/core/storage/storage.module.js'
import { PortalModule } from '../src/portal/portal.module.js'
import { PortalCacheService } from '../src/portal/shared/services/portal-cache.service.js'

const SLUG_PREFIX = 'e2e-visibility-'

interface Envelope<T> {
  statusCode: number
  data: T
}

describe('portal public visibility (SC-004)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let server: Server
  let authorId: string
  let categoryId: string

  const UNPUBLISHED_STATES = [
    {
      label: 'draft',
      data: { status: 'DRAFT' as const, publishedAt: null, deletedAt: null },
    },
    {
      label: 'scheduled for the future',
      data: {
        status: 'SCHEDULED' as const,
        publishedAt: new Date(Date.now() + 86_400_000),
        deletedAt: null,
      },
    },
    {
      label: 'archived',
      data: {
        status: 'ARCHIVED' as const,
        publishedAt: new Date(Date.now() - 86_400_000),
        deletedAt: null,
      },
    },
    {
      label: 'soft-deleted',
      data: {
        status: 'PUBLISHED' as const,
        publishedAt: new Date(Date.now() - 86_400_000),
        deletedAt: new Date(),
      },
    },
  ]

  const POST_TYPES = ['BERITA', 'ARTIKEL', 'PENGUMUMAN'] as const

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        StorageModule,
        AppCacheModule,
        PortalModule,
      ],
    })
      .overrideProvider(PortalCacheService)
      .useValue({
        get: () => Promise.resolve(undefined),
        set: () => Promise.resolve(),
        invalidate: () => Promise.resolve(),
      })
      .compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    app.useGlobalInterceptors(new ResponseInterceptor())
    await app.init()

    prisma = app.get(PrismaService)
    server = app.getHttpServer() as Server

    const [author] = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM users WHERE deleted_at IS NULL LIMIT 1
    `
    if (!author) throw new Error('e2e needs at least one user to author with')
    authorId = author.id

    const category = await prisma.postCategory.findFirst({
      where: { deletedAt: null },
      select: { id: true },
    })
    categoryId = category?.id ?? ''
  })

  afterAll(async () => {
    await prisma.post.deleteMany({
      where: { slug: { startsWith: SLUG_PREFIX } },
    })
    await prisma.agendaEntry.deleteMany({
      where: { slug: { startsWith: SLUG_PREFIX } },
    })
    await prisma.galleryAlbum.deleteMany({
      where: { slug: { startsWith: SLUG_PREFIX } },
    })
    await prisma.portalPage.deleteMany({
      where: { slug: { startsWith: SLUG_PREFIX } },
    })
    await app.close()
  })

  describe.each(POST_TYPES)('%s', (type) => {
    describe.each(UNPUBLISHED_STATES)('$label', ({ label, data }) => {
      const slug =
        `${SLUG_PREFIX}${type}-${label.replace(/\s+/g, '-')}`.toLowerCase()

      beforeAll(async () => {
        await prisma.post.create({
          data: {
            type,
            title: `E2E ${type} ${label}`,
            slug,
            summary: 'Tidak boleh terlihat publik',
            body: '<p>Rahasia</p>',
            categoryId: categoryId || null,
            authorId,
            ...data,
          },
        })
      })

      it('is absent from the public listing', async () => {
        const res = await request(server)
          .get(`/portal/public/posts?type=${type}&limit=50`)
          .expect(200)

        const body = res.body as Envelope<{ slug: string }[]>
        expect(body.data.map((item) => item.slug)).not.toContain(slug)
      })

      it('404s at its own address, identically to an unknown one', async () => {
        const hidden = await request(server).get(
          `/portal/public/posts/${type.toLowerCase()}/${slug}`,
        )
        const unknown = await request(server).get(
          `/portal/public/posts/${type.toLowerCase()}/${SLUG_PREFIX}never-existed`,
        )

        expect(hidden.status).toBe(404)
        expect(unknown.status).toBe(404)
        expect((hidden.body as Envelope<unknown>).statusCode).toBe(
          (unknown.body as Envelope<unknown>).statusCode,
        )
      })

      it('is absent from the sitemap', async () => {
        const res = await request(server)
          .get('/portal/public/sitemap')
          .expect(200)

        const body = res.body as Envelope<{ path: string }[]>
        expect(body.data.some((entry) => entry.path.includes(slug))).toBe(false)
      })

      it('is absent from the homepage', async () => {
        const res = await request(server)
          .get('/portal/public/homepage')
          .expect(200)

        expect(JSON.stringify(res.body)).not.toContain(slug)
      })

      it('has no link-preview metadata', async () => {
        await request(server)
          .get(
            `/portal/public/meta?path=/${type.toLowerCase()}/${encodeURIComponent(slug)}`,
          )
          .expect(404)
      })
    })
  })

  describe('agenda', () => {
    describe.each(UNPUBLISHED_STATES)('$label', ({ label, data }) => {
      const slug =
        `${SLUG_PREFIX}agenda-${label.replace(/\s+/g, '-')}`.toLowerCase()

      beforeAll(async () => {
        await prisma.agendaEntry.create({
          data: {
            title: `E2E agenda ${label}`,
            slug,
            description: '<p>Rahasia</p>',
            startTime: new Date(Date.now() + 3_600_000),
            endTime: new Date(Date.now() + 7_200_000),
            location: 'Aula',
            authorId,
            ...data,
          },
        })
      })

      it.each(['upcoming', 'past'])(
        'is absent from the %s listing',
        async (scope) => {
          const res = await request(server)
            .get(`/portal/public/agenda?scope=${scope}&limit=50`)
            .expect(200)

          const body = res.body as Envelope<{ slug: string }[]>
          expect(body.data.map((item) => item.slug)).not.toContain(slug)
        },
      )

      it('is absent from the sitemap', async () => {
        const res = await request(server)
          .get('/portal/public/sitemap')
          .expect(200)

        const body = res.body as Envelope<{ path: string }[]>
        expect(body.data.some((entry) => entry.path.includes(slug))).toBe(false)
      })

      it('404s at its own address', async () => {
        await request(server).get(`/portal/public/agenda/${slug}`).expect(404)
      })
    })
  })

  describe('gallery album', () => {
    describe.each(UNPUBLISHED_STATES)('$label', ({ label, data }) => {
      const slug =
        `${SLUG_PREFIX}album-${label.replace(/\s+/g, '-')}`.toLowerCase()

      beforeAll(async () => {
        await prisma.galleryAlbum.create({
          data: {
            title: `E2E album ${label}`,
            slug,
            eventDate: new Date(),
            authorId,
            ...data,
          },
        })
      })

      it('is absent from the public listing', async () => {
        const res = await request(server)
          .get('/portal/public/albums?limit=50')
          .expect(200)

        const body = res.body as Envelope<{ slug: string }[]>
        expect(body.data.map((item) => item.slug)).not.toContain(slug)
      })

      it('404s at its own address', async () => {
        await request(server).get(`/portal/public/albums/${slug}`).expect(404)
      })

      it('is absent from the sitemap', async () => {
        const res = await request(server)
          .get('/portal/public/sitemap')
          .expect(200)

        const body = res.body as Envelope<{ path: string }[]>
        expect(body.data.some((entry) => entry.path.includes(slug))).toBe(false)
      })
    })
  })

  describe('page', () => {
    describe.each(UNPUBLISHED_STATES)('$label', ({ label, data }) => {
      const slug =
        `${SLUG_PREFIX}page-${label.replace(/\s+/g, '-')}`.toLowerCase()

      beforeAll(async () => {
        await prisma.portalPage.create({
          data: {
            title: `E2E page ${label}`,
            slug,
            body: '<p>Rahasia</p>',
            authorId,
            status: data.status,
            publishedAt: data.publishedAt,
            deletedAt: data.deletedAt,
          },
        })
      })

      it('404s at its own address', async () => {
        await request(server).get(`/portal/public/pages/${slug}`).expect(404)
      })

      it('is not linked from the public navigation', async () => {
        const res = await request(server)
          .get('/portal/public/navigation')
          .expect(200)

        expect(JSON.stringify(res.body)).not.toContain(slug)
      })

      it('is absent from the sitemap', async () => {
        const res = await request(server)
          .get('/portal/public/sitemap')
          .expect(200)

        const body = res.body as Envelope<{ path: string }[]>
        expect(body.data.some((entry) => entry.path.includes(slug))).toBe(false)
      })

      it('is absent from /sitemap.xml', async () => {
        const res = await request(server).get('/sitemap.xml').expect(200)

        expect(res.text).not.toContain(slug)
      })
    })
  })

  describe('the control: a published item IS visible', () => {
    const slug = `${SLUG_PREFIX}published-control`

    beforeAll(async () => {
      await prisma.post.create({
        data: {
          type: 'BERITA',
          title: 'E2E published control',
          slug,
          summary: 'Harus terlihat',
          body: '<p>Terbit</p>',
          categoryId: categoryId || null,
          authorId,
          status: 'PUBLISHED',
          publishedAt: new Date(Date.now() - 3_600_000),
        },
      })
    })

    it('appears in the listing', async () => {
      const res = await request(server)
        .get('/portal/public/posts?type=BERITA&limit=50')
        .expect(200)

      const body = res.body as Envelope<{ slug: string }[]>
      expect(body.data.map((item) => item.slug)).toContain(slug)
    })

    it('is readable at its own address', async () => {
      await request(server)
        .get(`/portal/public/posts/berita/${slug}`)
        .expect(200)
    })

    it('appears in the sitemap', async () => {
      const res = await request(server)
        .get('/portal/public/sitemap')
        .expect(200)

      const body = res.body as Envelope<{ path: string }[]>
      expect(body.data.some((entry) => entry.path.includes(slug))).toBe(true)
    })

    it('appears in /sitemap.xml as a well-formed absolute URL', async () => {
      const res = await request(server).get('/sitemap.xml').expect(200)

      expect(res.headers['content-type']).toContain('xml')
      expect(res.text).toContain('<urlset')
      expect(res.text).toMatch(
        new RegExp(`<loc>https?://[^<]*/berita/${slug}</loc>`),
      )
    })

    it('has link-preview metadata a crawler can use', async () => {
      const res = await request(server)
        .get(`/portal/public/meta?path=/berita/${slug}`)
        .expect(200)

      const body = res.body as Envelope<{ title: string; type: string }>
      expect(body.data.title).toBe('E2E published control')
      expect(body.data.type).toBe('article')
    })
  })

  describe('crawler entry points', () => {
    it('serves robots.txt pointing at the sitemap', async () => {
      const res = await request(server).get('/robots.txt').expect(200)

      expect(res.text).toContain('Sitemap:')
      expect(res.text).toContain('/sitemap.xml')
      expect(res.text).toContain('Disallow: /admin/')
    })
  })
})
