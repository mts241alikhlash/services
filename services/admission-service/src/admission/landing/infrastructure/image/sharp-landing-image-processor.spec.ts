import { BadRequestException } from '@nestjs/common'
import sharp from 'sharp'
import { LANDING_IMAGE_REJECTED } from '../../domain/policies/landing-image-upload.policy.js'
import { SharpLandingImageProcessor } from './sharp-landing-image-processor.js'

const solid = (width: number, height: number) =>
  sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 30, g: 60, b: 120 },
    },
  })

describe('SharpLandingImageProcessor', () => {
  const processor = new SharpLandingImageProcessor()

  it('shrinks a large portrait PNG inside the poster limit and encodes WebP', async () => {
    const input = await solid(3000, 4000).png().toBuffer()

    const result = await processor.process(input, 'poster')

    const meta = await sharp(result.content).metadata()
    expect(meta.format).toBe('webp')
    expect(result.width).toBeLessThanOrEqual(1080)
    expect(result.height).toBeLessThanOrEqual(1920)
    expect(result.width / result.height).toBeCloseTo(0.75, 1)
    expect(meta.width).toBe(result.width)
    expect(meta.height).toBe(result.height)
  })

  it('limits a photo to 1600 pixels on the long side', async () => {
    const input = await solid(4000, 2000).jpeg().toBuffer()

    const result = await processor.process(input, 'photo')

    expect(result.width).toBe(1600)
    expect(result.height).toBe(800)
  })

  it('does not enlarge a small image', async () => {
    const input = await solid(300, 200).png().toBuffer()

    const result = await processor.process(input, 'photo')

    expect([result.width, result.height]).toEqual([300, 200])
  })

  it('applies the EXIF rotation', async () => {
    const input = await solid(200, 100)
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer()

    const result = await processor.process(input, 'photo')

    expect([result.width, result.height]).toEqual([100, 200])
  })

  it('drops the metadata', async () => {
    const input = await solid(200, 100)
      .jpeg()
      .withMetadata({ exif: { IFD0: { Copyright: 'secret' } } })
      .toBuffer()

    const result = await processor.process(input, 'photo')

    const meta = await sharp(result.content).metadata()
    expect(meta.exif).toBeUndefined()
  })

  it('refuses bytes that are not a decodable image', async () => {
    const header = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      Buffer.from('not really a jpeg'),
    ])
    await expect(processor.process(header, 'photo')).rejects.toEqual(
      new BadRequestException(LANDING_IMAGE_REJECTED),
    )
  })

  it('refuses an image above the pixel cap', async () => {
    const small = new SharpLandingImageProcessor(1000)
    const input = await solid(100, 100).png().toBuffer()

    await expect(small.process(input, 'photo')).rejects.toEqual(
      new BadRequestException(LANDING_IMAGE_REJECTED),
    )
  })
})
