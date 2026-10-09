import { BadRequestException } from '@nestjs/common'
import { MAX_UPLOAD_BYTES } from '../../../../core/upload/upload-limits.js'
import {
  LANDING_IMAGE_REJECTED,
  assertLandingImage,
} from './landing-image-upload.policy.js'

const jpeg = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  Buffer.alloc(20),
])
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(20),
])
const webp = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.alloc(4),
  Buffer.from('WEBP'),
  Buffer.alloc(20),
])

describe('assertLandingImage', () => {
  it.each([
    ['a JPEG', jpeg],
    ['a PNG', png],
    ['a WebP', webp],
  ])('accepts %s', (_name, buffer) => {
    expect(() => assertLandingImage(buffer)).not.toThrow()
  })

  it.each([
    ['a missing file', undefined],
    ['an empty file', Buffer.alloc(0)],
    ['a ZIP', Buffer.from('PK\u0003\u0004zip')],
    ['plain text', Buffer.from('hello world, not an image')],
    ['a PDF', Buffer.from('%PDF-1.7 ....')],
    [
      'RIFF that is not WebP',
      Buffer.concat([
        Buffer.from('RIFF'),
        Buffer.alloc(4),
        Buffer.from('WAVE'),
      ]),
    ],
    [
      'a file over the limit',
      Buffer.concat([jpeg, Buffer.alloc(MAX_UPLOAD_BYTES)]),
    ],
  ])('refuses %s', (_name, buffer) => {
    expect(() => assertLandingImage(buffer)).toThrow(
      new BadRequestException(LANDING_IMAGE_REJECTED),
    )
  })
})
