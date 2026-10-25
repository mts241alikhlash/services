import { detectImageType } from './detect-image-type.policy.js'

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0])
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0])
const webp = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x24, 0, 0, 0]),
  Buffer.from('WEBPVP8 '),
])

describe('detectImageType', () => {
  it('recognizes PNG, JPEG and WebP by their first bytes', () => {
    expect(detectImageType(png)).toBe('image/png')
    expect(detectImageType(jpeg)).toBe('image/jpeg')
    expect(detectImageType(webp)).toBe('image/webp')
  })

  it('refuses a PDF, a WAV file (also RIFF) and short or empty input', () => {
    expect(detectImageType(Buffer.from('%PDF-1.7\n'))).toBeNull()
    expect(
      detectImageType(
        Buffer.concat([
          Buffer.from('RIFF'),
          Buffer.alloc(4),
          Buffer.from('WAVEfmt '),
        ]),
      ),
    ).toBeNull()
    expect(detectImageType(Buffer.from([0xff, 0xd8]))).toBeNull()
    expect(detectImageType(Buffer.alloc(0))).toBeNull()
  })
})
