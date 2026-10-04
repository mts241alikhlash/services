import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ContentStatus } from '../domain/enums/content-status.enum.js'
import { PostType } from '../domain/enums/post-type.enum.js'
import { IPostRepository } from '../domain/interfaces/post-repository.interface.js'
import { PreviewPostUseCase } from './preview-post.use-case.js'

const AUTHOR_ID = '11111111-1111-4111-8111-111111111111'
const COVER_ID = '22222222-2222-4222-8222-222222222222'

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'post-1',
    type: PostType.BERITA,
    title: 'Juara 1 Olimpiade',
    slug: 'juara-1-olimpiade',
    summary: 'Ringkasan',
    body: '<p>Isi</p>',
    coverFileId: COVER_ID,
    coverAltText: 'Piala',
    categoryId: null,
    status: ContentStatus.DRAFT,
    publishedAt: null,
    scheduledAt: null,
    expiresAt: null,
    attachmentFileId: null,
    pinnedAt: null,
    metaTitle: null,
    metaDescription: null,
    authorId: AUTHOR_ID,
    version: 1,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    deletedAt: null,
    author: { id: AUTHOR_ID, identifier: 'humas', profile: { name: 'Humas' } },
    category: null,
    coverFile: null,
    attachment: null,
    tags: [],
    ...overrides,
  }
}

describe('PreviewPostUseCase', () => {
  let useCase: PreviewPostUseCase
  const repository = { findById: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreviewPostUseCase,
        { provide: IPostRepository, useValue: repository },
      ],
    }).compile()

    useCase = module.get(PreviewPostUseCase)
    jest.clearAllMocks()
    repository.findById.mockResolvedValue(row())
  })

  it.each([
    ['a draft', { status: ContentStatus.DRAFT, publishedAt: null }],
    [
      'a future-scheduled item',
      {
        status: ContentStatus.SCHEDULED,
        publishedAt: new Date('2030-01-01T00:00:00.000Z'),
      },
    ],
    [
      'an archived item',
      {
        status: ContentStatus.ARCHIVED,
        publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ],
  ])('previews %s that no visitor could open', async (_label, overrides) => {
    repository.findById.mockResolvedValue(row(overrides))

    const result = await useCase.execute('post-1')

    expect(result.title).toBe('Juara 1 Olimpiade')
    expect(result.body).toBe('<p>Isi</p>')
  })

  it('renders the public shape, not the admin one', async () => {
    const result = await useCase.execute('post-1')

    expect(result).not.toHaveProperty('status')
    expect(result).not.toHaveProperty('version')
    expect(result).not.toHaveProperty('authorId')
    expect(result.coverImageUrl).toBe(`/portal/public/media/${COVER_ID}`)
  })

  it('applies the same metadata fallbacks a visitor would see', async () => {
    const result = await useCase.execute('post-1')

    expect(result.metaTitle).toBe('Juara 1 Olimpiade')
    expect(result.metaDescription).toBe('Ringkasan')
  })

  it('dates an unpublished draft as if it went out now', async () => {
    const before = Date.now()

    const result = await useCase.execute('post-1')

    expect(result.publishedAt.getTime()).toBeGreaterThanOrEqual(before)
  })

  it('keeps the real publication date for something already published', async () => {
    const publishedAt = new Date('2026-08-01T00:00:00.000Z')
    repository.findById.mockResolvedValue(
      row({ status: ContentStatus.PUBLISHED, publishedAt }),
    )

    const result = await useCase.execute('post-1')

    expect(result.publishedAt).toEqual(publishedAt)
  })

  it('404s on a soft-deleted item', async () => {
    repository.findById.mockResolvedValue(row({ deletedAt: new Date() }))

    await expect(useCase.execute('post-1')).rejects.toThrow(NotFoundException)
  })

  it('404s on an unknown id', async () => {
    repository.findById.mockResolvedValue(null)

    await expect(useCase.execute('post-1')).rejects.toThrow(NotFoundException)
  })
})
