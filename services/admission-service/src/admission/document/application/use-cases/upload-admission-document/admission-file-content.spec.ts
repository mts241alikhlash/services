import { BadRequestException } from '@nestjs/common'
import { assertValidAdmissionFile } from './upload-admission-document.use-case.js'

const PDF = Buffer.from('%PDF-1.7\n%âãÏÓ\n1 0 obj')
const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13,
])
const JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46,
])
const HTML = Buffer.from('<html><script>alert(1)</script></html>')

const file = (buffer: Buffer, mimetype: string) => ({
  buffer,
  mimetype,
  originalname: 'scan',
  size: buffer.length,
})

describe('assertValidAdmissionFile content', () => {
  it.each([
    ['a PDF', PDF, 'application/pdf'],
    ['a PNG', PNG, 'image/png'],
    ['a JPEG', JPEG, 'image/jpeg'],
  ])('accepts %s whose bytes match its type', (_label, buffer, mimetype) => {
    expect(() => assertValidAdmissionFile(file(buffer, mimetype))).not.toThrow()
  })

  it('refuses a page dressed up as an image', () => {
    expect(() => assertValidAdmissionFile(file(HTML, 'image/png'))).toThrow(
      new BadRequestException('Isi berkas tidak sesuai dengan jenisnya'),
    )
  })

  it('refuses a PNG sent as a PDF', () => {
    expect(() =>
      assertValidAdmissionFile(file(PNG, 'application/pdf')),
    ).toThrow(BadRequestException)
  })
})
