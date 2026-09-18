import { NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { IAgendaRepository } from '../../agenda/domain/interfaces/agenda-repository.interface.js'
import { IGalleryRepository } from '../../gallery/domain/interfaces/gallery-repository.interface.js'
import { GetPublicPageUseCase } from '../../page/use-cases/get-public-page.use-case.js'
import { GetPublicPostBySlugUseCase } from '../../post/use-cases/get-public-post-by-slug.use-case.js'
import { GetPageMetaUseCase } from './get-page-meta.use-case.js'
import { PortalCacheService } from '../../shared/services/portal-cache.service.js'

const COVER_ID = '22222222-2222-4222-8222-222222222222'

const cacheMock = { invalidate: jest.fn(), get: jest.fn(), set: jest.fn() }

const post = {
  id: 'post-1',
  type: 'BERITA' as const,
  title: 'Juara 1 Olimpiade',
  slug: 'juara-1-olimpiade',
  summary: 'Ringkasan',
  body: '<p>Isi</p>',
  coverImageUrl: `/portal/public/media/${COVER_ID}`,
  coverAltText: 'Piala',
  category: null,
  authorName: 'Humas',
  publishedAt: new Date('2026-08-01T00:00:00.000Z'),
  updatedAt: new Date('2026-08-02T00:00:00.000Z'),
  expiresAt: null,
  attachmentUrl: null,
  metaTitle: 'Juara 1 Olimpiade',
  metaDescription: 'Ringkasan',
  tags: [],
}

describe('GetPageMetaUseCase', () => {
  let useCase: GetPageMetaUseCase
  const bySlug = { executeOrThrow: jest.fn() }
  const byPageSlug = { execute: jest.fn() }
  const agendaRepository = { findPublicBySlug: jest.fn() }
  const galleryRepository = { findPublicAlbumBySlug: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PortalCacheService, useValue: cacheMock },
        GetPageMetaUseCase,
        { provide: GetPublicPostBySlugUseCase, useValue: bySlug },
        { provide: GetPublicPageUseCase, useValue: byPageSlug },
        { provide: IAgendaRepository, useValue: agendaRepository },
        { provide: IGalleryRepository, useValue: galleryRepository },
        {
          provide: ConfigService,
          useValue: { get: () => 'https://portal.example.sch.id' },
        },
      ],
    }).compile()

    useCase = module.get(GetPageMetaUseCase)
    jest.clearAllMocks()
    bySlug.executeOrThrow.mockResolvedValue(post)
    byPageSlug.execute.mockResolvedValue(null)
    agendaRepository.findPublicBySlug.mockResolvedValue(null)
    galleryRepository.findPublicAlbumBySlug.mockResolvedValue(null)
  })

  it('resolves an article path to its own card', async () => {
    const meta = await useCase.execute('/berita/juara-1-olimpiade')

    expect(meta.title).toBe('Juara 1 Olimpiade')
    expect(meta.type).toBe('article')
    expect(bySlug.executeOrThrow).toHaveBeenCalledWith(
      'BERITA',
      'juara-1-olimpiade',
    )
  })

  it('points og:image at the share-preview variant, not the original', async () => {
    const meta = await useCase.execute('/berita/juara-1-olimpiade')

    expect(meta.imageUrl).toBe(
      `https://portal.example.sch.id/portal/public/media/${COVER_ID}?variant=preview`,
    )
  })

  it('makes every URL absolute', async () => {
    const meta = await useCase.execute('/berita/juara-1-olimpiade')

    expect(meta.canonicalUrl).toBe(
      'https://portal.example.sch.id/berita/juara-1-olimpiade',
    )
    expect(meta.imageUrl?.startsWith('https://')).toBe(true)
  })

  it('never emits a signed storage URL', async () => {
    const meta = await useCase.execute('/berita/juara-1-olimpiade')

    expect(meta.imageUrl).toContain('/portal/public/media/')
    expect(meta.imageUrl).not.toContain('X-Amz-Signature')
  })

  it('gives the homepage the site-level card', async () => {
    const meta = await useCase.execute('/')

    expect(meta.type).toBe('website')
    expect(meta.title).toBe('Portal MTs Persis 241 Al-Ikhlash')
    expect(bySlug.executeOrThrow).not.toHaveBeenCalled()
  })

  it('gives a listing the site-level card rather than its newest item', async () => {
    const meta = await useCase.execute('/berita')

    expect(meta.type).toBe('website')
    expect(bySlug.executeOrThrow).not.toHaveBeenCalled()
  })

  it('404s on a path that is not part of the public address space', async () => {
    await expect(useCase.execute('/does-not-exist/anything')).rejects.toThrow(
      NotFoundException,
    )
  })

  it('404s on a draft, so the caller falls back to defaults', async () => {
    bySlug.executeOrThrow.mockRejectedValue(new NotFoundException())

    await expect(useCase.execute('/berita/masih-draft')).rejects.toThrow(
      NotFoundException,
    )
  })

  describe('every public address shape, not just posts', () => {
    it('resolves an agenda entry', async () => {
      agendaRepository.findPublicBySlug.mockResolvedValue({
        title: 'Pentas Seni Akhir Tahun',
        description: '<p>Acara tahunan di aula madrasah.</p>',
        coverFileId: COVER_ID,
        publishedAt: new Date('2026-08-01T00:00:00.000Z'),
      })

      const meta = await useCase.execute('/agenda/pentas-seni-akhir-tahun')

      expect(meta.title).toBe('Pentas Seni Akhir Tahun')
      expect(meta.type).toBe('article')
      expect(meta.description).toBe('Acara tahunan di aula madrasah.')
      expect(meta.imageUrl).toContain('?variant=preview')
    })

    it('resolves a photo album', async () => {
      galleryRepository.findPublicAlbumBySlug.mockResolvedValue({
        title: 'Pentas Seni 2026',
        description: 'Dokumentasi kegiatan.',
        coverFileId: COVER_ID,
        publishedAt: new Date('2026-08-01T00:00:00.000Z'),
      })

      const meta = await useCase.execute('/galeri/pentas-seni-2026')

      expect(meta.title).toBe('Pentas Seni 2026')
      expect(meta.imageUrl).toContain('?variant=preview')
    })

    it('resolves an informational page at the root', async () => {
      byPageSlug.execute.mockResolvedValue({
        kind: 'found',
        page: {
          metaTitle: 'Visi & Misi',
          metaDescription: 'Arah dan tujuan madrasah.',
          publishedAt: new Date('2026-08-01T00:00:00.000Z'),
        },
      })

      const meta = await useCase.execute('/visi-misi')

      expect(meta.title).toBe('Visi & Misi')
      expect(meta.description).toBe('Arah dan tujuan madrasah.')
      expect(meta.imageUrl).toBeNull()
    })

    it('404s on a page address that has since moved', async () => {
      byPageSlug.execute.mockResolvedValue({ kind: 'moved', slug: 'profil' })

      await expect(useCase.execute('/profil-lama')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('404s on an agenda entry a visitor cannot see', async () => {
      agendaRepository.findPublicBySlug.mockResolvedValue(null)

      await expect(useCase.execute('/agenda/masih-draft')).rejects.toThrow(
        NotFoundException,
      )
    })

    it.each(['/agenda', '/galeri', '/pengumuman'])(
      'gives %s the site card, not its newest item',
      async (path) => {
        const meta = await useCase.execute(path)

        expect(meta.type).toBe('website')
        expect(agendaRepository.findPublicBySlug).not.toHaveBeenCalled()
        expect(galleryRepository.findPublicAlbumBySlug).not.toHaveBeenCalled()
      },
    )
  })

  it('omits the image when the item has no cover', async () => {
    bySlug.executeOrThrow.mockResolvedValue({ ...post, coverImageUrl: null })

    const meta = await useCase.execute('/berita/juara-1-olimpiade')

    expect(meta.imageUrl).toBeNull()
  })
})
