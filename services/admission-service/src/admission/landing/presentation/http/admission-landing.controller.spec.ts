import 'reflect-metadata'
import { StreamableFile } from '@nestjs/common'
import { Readable } from 'node:stream'
import { IS_PUBLIC_KEY } from '../../../../core/decorators/public.decorator.js'
import { PERMISSIONS_KEY } from '../../../../platform/access-control/permission/decorators/require-permissions.decorator.js'
import { AdmissionLandingController } from './admission-landing.controller.js'
import { AdmissionLandingPublicController } from './admission-landing-public.controller.js'

const overview = {
  sections: {
    hero: null,
    life: null,
    info: null,
    steps: null,
    faq: null,
    stories: null,
    closing: { title: 'x' },
  },
  hasUnpublishedChanges: true,
  publishedAt: new Date('2026-10-09T10:00:00Z'),
}

describe('AdmissionLandingController permissions', () => {
  const proto = AdmissionLandingController.prototype
  const needs = (handler: keyof typeof proto) =>
    Reflect.getMetadata(PERMISSIONS_KEY, proto[handler])

  it('names one code per handler', () => {
    expect(needs('draft')).toEqual(['admission-landing.read'])
    expect(needs('saveSection')).toEqual(['admission-landing.update'])
    expect(needs('uploadImage')).toEqual(['admission-landing.update'])
    expect(needs('discard')).toEqual(['admission-landing.update'])
    expect(needs('publish')).toEqual(['admission-landing.publish'])
  })

  it('returns the overview with an ISO publish time', async () => {
    const getLanding = { draft: jest.fn().mockResolvedValue(overview) }
    const controller = new AdmissionLandingController(
      getLanding as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    )

    const body = await controller.draft()

    expect(body.hasUnpublishedChanges).toBe(true)
    expect(body.publishedAt).toBe('2026-10-09T10:00:00.000Z')
    expect(body.sections.closing).toEqual({ title: 'x' })
    expect(body.sections.hero).toBeNull()
  })

  it('saves a section for the signed-in user', async () => {
    const save = { execute: jest.fn().mockResolvedValue(overview) }
    const controller = new AdmissionLandingController(
      {} as never,
      save as never,
      {} as never,
      {} as never,
      {} as never,
    )

    await controller.saveSection('closing', { content: { title: 'x' } }, {
      id: 'u1',
    } as never)

    expect(save.execute).toHaveBeenCalledWith('closing', { title: 'x' }, 'u1')
  })

  it('uploads an image and returns only its public fields', async () => {
    const upload = {
      execute: jest.fn().mockResolvedValue({
        id: 'i1',
        width: 1080,
        height: 1920,
        sizeBytes: 9,
        fileKey: 'secret.webp',
        createdAt: new Date(),
      }),
    }
    const controller = new AdmissionLandingController(
      {} as never,
      {} as never,
      upload as never,
      {} as never,
      {} as never,
    )
    const file = { buffer: Buffer.from('x'), originalname: 'a.png' }

    const body = await controller.uploadImage(
      { purpose: 'poster' },
      file as never,
      { id: 'u1' } as never,
    )

    expect(upload.execute).toHaveBeenCalledWith({
      file,
      purpose: 'poster',
      userId: 'u1',
    })
    expect(body).toEqual({ id: 'i1', width: 1080, height: 1920, sizeBytes: 9 })
  })
})

describe('AdmissionLandingPublicController', () => {
  const proto = AdmissionLandingPublicController.prototype

  it('is public on both routes', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, proto.published)).toBe(true)
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, proto.image)).toBe(true)
  })

  it('lets the published content be cached for a minute', () => {
    expect(Reflect.getMetadata('__headers__', proto.published)).toContainEqual({
      name: 'Cache-Control',
      value: 'public, max-age=60',
    })
  })

  it('returns the published sections with null for the unpublished ones', async () => {
    const getLanding = {
      published: jest.fn().mockResolvedValue({
        hero: null,
        life: null,
        info: null,
        steps: null,
        faq: null,
        stories: null,
        closing: { title: 'x' },
      }),
    }
    const controller = new AdmissionLandingPublicController(
      getLanding as never,
      {} as never,
    )

    const body = await controller.published()

    expect(body.closing).toEqual({ title: 'x' })
    expect(body.hero).toBeNull()
  })

  it('streams an image as long-cached WebP', async () => {
    const stream = Readable.from(['x'])
    const getImage = {
      execute: jest
        .fn()
        .mockResolvedValue({ image: { id: 'i1', sizeBytes: 9 }, stream }),
    }
    const res = { set: jest.fn() }
    const controller = new AdmissionLandingPublicController(
      {} as never,
      getImage as never,
    )

    const result = await controller.image('i1', res as never)

    expect(res.set).toHaveBeenCalledWith({
      'Content-Type': 'image/webp',
      'Content-Length': '9',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=31536000, immutable',
    })
    expect(result).toBeInstanceOf(StreamableFile)
    expect(result.getStream()).toBe(stream)
  })
})
