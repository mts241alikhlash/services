import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { Readable } from 'node:stream'
import type {
  LandingImageEntity,
  LandingSectionRecord,
} from '../domain/entities/landing.entity.js'
import { LandingImageGarbageCollector } from './landing-image-garbage-collector.js'
import { GetLandingUseCase } from './use-cases/get-landing/get-landing.use-case.js'
import { SaveLandingSectionUseCase } from './use-cases/save-landing-section/save-landing-section.use-case.js'
import { UploadLandingImageUseCase } from './use-cases/upload-landing-image/upload-landing-image.use-case.js'
import { PublishLandingUseCase } from './use-cases/publish-landing/publish-landing.use-case.js'
import { DiscardLandingUseCase } from './use-cases/discard-landing/discard-landing.use-case.js'
import { GetLandingImageUseCase } from './use-cases/get-landing-image/get-landing-image.use-case.js'

const USER = '11111111-1111-4111-8111-111111111111'
const IMG_A = '3f1c1b7e-5a53-4c0e-9f6a-2d3b8f1a9c11'
const IMG_B = '7d0a5f6e-3b1c-4e2d-8a9f-0c1d2e3f4a5b'
const DAY = 24 * 60 * 60 * 1000

const closing = (imageId?: string) => ({
  title: 'Sampai bertemu.',
  description: 'Mulai dengan satu akun.',
  registerLabel: 'Mulai pendaftaran',
  requirementsLabel: 'Periksa persyaratan',
  photo: {
    image: imageId ? { imageId } : { src: '/hero/rapat-orangtua.webp' },
    alt: 'Orang tua santri',
  },
})

class FakeRepository {
  sections = new Map<string, LandingSectionRecord & { draft: unknown }>()
  images = new Map<string, LandingImageEntity>()
  private counter = 0

  findAllSections() {
    return Promise.resolve([...this.sections.values()])
  }

  saveDraft(key: string, document: unknown) {
    const current = this.sections.get(key)
    this.sections.set(key, {
      key,
      published: current?.published ?? null,
      publishedAt: current?.publishedAt ?? null,
      draft: document,
    })
    return Promise.resolve()
  }

  publishAll() {
    let count = 0
    for (const record of this.sections.values()) {
      if (record.draft != null) {
        record.published = record.draft
        record.draft = null
        record.publishedAt = new Date('2026-10-09T10:00:00Z')
        count += 1
      }
    }
    return Promise.resolve(count)
  }

  discardAll() {
    for (const record of this.sections.values()) record.draft = null
    return Promise.resolve()
  }

  findImage(id: string) {
    return Promise.resolve(this.images.get(id) ?? null)
  }

  findImagesByIds(ids: string[]) {
    return Promise.resolve(ids.flatMap((id) => this.images.get(id) ?? []))
  }

  findAllImages() {
    return Promise.resolve([...this.images.values()])
  }

  createImage(input: {
    fileKey: string
    width: number
    height: number
    sizeBytes: number
  }) {
    this.counter += 1
    const image = {
      id: `00000000-0000-4000-8000-00000000000${this.counter}`,
      createdAt: new Date(),
      ...input,
    }
    this.images.set(image.id, image)
    return Promise.resolve(image)
  }

  deleteImages(ids: string[]) {
    const removed = ids.flatMap((id) => this.images.get(id) ?? [])
    ids.forEach((id) => this.images.delete(id))
    return Promise.resolve(removed)
  }
}

function storage() {
  return {
    put: jest.fn().mockResolvedValue(undefined),
    read: jest.fn().mockResolvedValue({ stream: Readable.from(['x']) }),
    remove: jest.fn().mockResolvedValue(undefined),
  }
}

function seedImage(repo: FakeRepository, id: string, ageMs: number) {
  repo.images.set(id, {
    id,
    fileKey: `admission-landing/${id}.webp`,
    width: 10,
    height: 10,
    sizeBytes: 5,
    createdAt: new Date(Date.now() - ageMs),
  })
}

function setup() {
  const repo = new FakeRepository()
  const store = storage()
  const gc = new LandingImageGarbageCollector(repo, store)
  return { repo, store, gc }
}

describe('GetLandingUseCase', () => {
  it('returns published content and null for sections never published', async () => {
    const { repo } = setup()
    repo.sections.set('closing', {
      key: 'closing',
      published: closing(),
      draft: closing('x'),
      publishedAt: null,
    })

    const published = await new GetLandingUseCase(repo).published()

    expect(published.closing).toEqual(closing())
    expect(published.hero).toBeNull()
    expect(Object.keys(published)).toEqual([
      'hero',
      'life',
      'info',
      'steps',
      'faq',
      'stories',
      'closing',
    ])
  })

  it('shows staff the draft over the published content', async () => {
    const { repo } = setup()
    repo.sections.set('closing', {
      key: 'closing',
      published: closing(),
      draft: { ...closing(), title: 'Baru' },
      publishedAt: null,
    })

    const overview = await new GetLandingUseCase(repo).draft()

    expect((overview.sections.closing as { title: string }).title).toBe('Baru')
    expect(overview.hasUnpublishedChanges).toBe(true)
  })
})

describe('SaveLandingSectionUseCase', () => {
  it('saves a valid draft, leaves published alone and returns the overview', async () => {
    const { repo, gc } = setup()
    const overview = await new SaveLandingSectionUseCase(repo, gc).execute(
      'closing',
      closing(),
      USER,
    )

    expect(repo.sections.get('closing')?.draft).toEqual(closing())
    expect(repo.sections.get('closing')?.published).toBeNull()
    expect(overview.hasUnpublishedChanges).toBe(true)
  })

  it('refuses an unknown section and a broken document, saving nothing', async () => {
    const { repo, gc } = setup()
    const useCase = new SaveLandingSectionUseCase(repo, gc)

    await expect(useCase.execute('footer', {}, USER)).rejects.toBeInstanceOf(
      BadRequestException,
    )
    await expect(
      useCase.execute('closing', { ...closing(), title: '' }, USER),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(repo.sections.size).toBe(0)
  })

  it('refuses a draft that points at an image that does not exist', async () => {
    const { repo, gc } = setup()
    await expect(
      new SaveLandingSectionUseCase(repo as never, gc).execute(
        'closing',
        closing(IMG_A),
        USER,
      ),
    ).rejects.toEqual(new BadRequestException('Gambar tidak ditemukan'))
    expect(repo.sections.size).toBe(0)
  })

  it('accepts a draft that points at an uploaded image', async () => {
    const { repo, gc } = setup()
    seedImage(repo, IMG_A, 1000)
    await new SaveLandingSectionUseCase(repo, gc).execute(
      'closing',
      closing(IMG_A),
      USER,
    )
    expect(repo.sections.get('closing')?.draft).toEqual(closing(IMG_A))
  })
})

describe('UploadLandingImageUseCase', () => {
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(20),
  ])
  const processed = {
    content: Buffer.from('webp-bytes'),
    width: 1080,
    height: 1920,
  }

  function build(
    processor = { process: jest.fn().mockResolvedValue(processed) },
  ) {
    const repo = new FakeRepository()
    const store = storage()
    return {
      repo,
      store,
      processor,
      useCase: new UploadLandingImageUseCase(repo, processor, store),
    }
  }

  it('processes, stores and records the image', async () => {
    const { repo, store, processor, useCase } = build()

    const image = await useCase.execute({
      file: { buffer: png },
      purpose: 'poster',
      userId: USER,
    })

    expect(processor.process).toHaveBeenCalledWith(png, 'poster')
    const [key, content] = store.put.mock.calls[0] as [string, Buffer]
    expect(key).toMatch(/^admission-landing\/[0-9a-f-]{36}\.webp$/)
    expect(content).toBe(processed.content)
    expect(repo.images.get(image.id)).toMatchObject({
      fileKey: key,
      width: 1080,
      height: 1920,
      sizeBytes: processed.content.length,
    })
  })

  it('refuses a non-image before processing or storing', async () => {
    const { store, processor, useCase } = build()
    await expect(
      useCase.execute({
        file: { buffer: Buffer.from('PK\u0003\u0004') },
        purpose: 'photo',
        userId: USER,
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    await expect(
      useCase.execute({ file: undefined, purpose: 'photo', userId: USER }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(processor.process).not.toHaveBeenCalled()
    expect(store.put).not.toHaveBeenCalled()
  })

  it('stores nothing when processing fails', async () => {
    const { store, useCase } = build({
      process: jest.fn().mockRejectedValue(new BadRequestException('x')),
    })
    await expect(
      useCase.execute({
        file: { buffer: png },
        purpose: 'photo',
        userId: USER,
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(store.put).not.toHaveBeenCalled()
  })

  it('removes the stored object when the row cannot be written', async () => {
    const { repo, store, useCase } = build()
    repo.createImage = jest.fn().mockRejectedValue(new Error('db down'))
    await expect(
      useCase.execute({
        file: { buffer: png },
        purpose: 'photo',
        userId: USER,
      }),
    ).rejects.toThrow('db down')
    expect(store.remove).toHaveBeenCalledWith(store.put.mock.calls[0][0])
  })
})

describe('PublishLandingUseCase and DiscardLandingUseCase', () => {
  it('publishes every draft at once and clears them', async () => {
    const { repo, gc } = setup()
    repo.sections.set('closing', {
      key: 'closing',
      published: null,
      draft: closing(),
      publishedAt: null,
    })
    repo.sections.set('faq', {
      key: 'faq',
      published: null,
      draft: { title: 'x' },
      publishedAt: null,
    })

    const overview = await new PublishLandingUseCase(repo, gc).execute(USER)

    expect(repo.sections.get('closing')?.published).toEqual(closing())
    expect(repo.sections.get('faq')?.published).toEqual({ title: 'x' })
    expect(repo.sections.get('closing')?.draft).toBeNull()
    expect(overview.hasUnpublishedChanges).toBe(false)
    expect(overview.publishedAt).toEqual(new Date('2026-10-09T10:00:00Z'))
  })

  it('answers 409 when there is no draft', async () => {
    const { repo, gc } = setup()
    await expect(
      new PublishLandingUseCase(repo as never, gc).execute(USER),
    ).rejects.toEqual(
      new ConflictException('Tidak ada perubahan untuk diterbitkan'),
    )
  })

  it('discards drafts and keeps the published content', async () => {
    const { repo, gc } = setup()
    repo.sections.set('closing', {
      key: 'closing',
      published: closing(),
      draft: { ...closing(), title: 'Baru' },
      publishedAt: null,
    })

    const overview = await new DiscardLandingUseCase(repo, gc).execute()

    expect(repo.sections.get('closing')?.published).toEqual(closing())
    expect(repo.sections.get('closing')?.draft).toBeNull()
    expect((overview.sections.closing as { title: string }).title).toBe(
      'Sampai bertemu.',
    )
    expect(overview.hasUnpublishedChanges).toBe(false)
  })
})

describe('LandingImageGarbageCollector', () => {
  it('deletes old images nothing references, and their stored objects', async () => {
    const { repo, store, gc } = setup()
    seedImage(repo, IMG_A, 2 * DAY)
    seedImage(repo, IMG_B, 2 * DAY)
    repo.sections.set('closing', {
      key: 'closing',
      published: closing(IMG_A),
      draft: null,
      publishedAt: null,
    })

    await gc.run()

    expect([...repo.images.keys()]).toEqual([IMG_A])
    expect(store.remove).toHaveBeenCalledWith(`admission-landing/${IMG_B}.webp`)
  })

  it('keeps an image only a draft uses, and one only the published document uses', async () => {
    const { repo, gc } = setup()
    seedImage(repo, IMG_A, 2 * DAY)
    seedImage(repo, IMG_B, 2 * DAY)
    repo.sections.set('closing', {
      key: 'closing',
      published: closing(IMG_A),
      draft: closing(IMG_B),
      publishedAt: null,
    })

    await gc.run()

    expect([...repo.images.keys()].sort()).toEqual([IMG_A, IMG_B].sort())
  })

  it('keeps an image uploaded less than a day ago', async () => {
    const { repo, gc } = setup()
    seedImage(repo, IMG_A, 60_000)
    await gc.run()
    expect(repo.images.has(IMG_A)).toBe(true)
  })

  it('does not fail when an object cannot be removed', async () => {
    const { repo, store, gc } = setup()
    seedImage(repo, IMG_A, 2 * DAY)
    store.remove.mockRejectedValue(new Error('s3 down'))
    await expect(gc.run()).resolves.toBeUndefined()
    expect(repo.images.has(IMG_A)).toBe(false)
  })

  it('does nothing when nothing is unused', async () => {
    const { repo, store, gc } = setup()
    const spy = jest.spyOn(repo, 'deleteImages')
    await gc.run()
    expect(spy).not.toHaveBeenCalled()
    expect(store.remove).not.toHaveBeenCalled()
  })
})

describe('GetLandingImageUseCase', () => {
  it('streams a stored image', async () => {
    const { repo } = setup()
    seedImage(repo, IMG_A, 1000)
    const store = storage()
    const result = await new GetLandingImageUseCase(repo, store).execute(IMG_A)
    expect(store.read).toHaveBeenCalledWith(`admission-landing/${IMG_A}.webp`)
    expect(result.image.id).toBe(IMG_A)
    expect(result.stream).toBeInstanceOf(Readable)
  })

  it('404s for an unknown image', async () => {
    const { repo } = setup()
    await expect(
      new GetLandingImageUseCase(repo as never, storage() as never).execute(
        IMG_A,
      ),
    ).rejects.toEqual(new NotFoundException('Gambar tidak ditemukan'))
  })
})
