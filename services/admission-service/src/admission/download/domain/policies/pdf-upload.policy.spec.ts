import { BadRequestException } from '@nestjs/common'
import { MAX_UPLOAD_BYTES } from '../../../../core/upload/upload-limits.js'
import { PDF_REJECTED, toStoredPdf } from './pdf-upload.policy.js'

const pdf = (extra = 10) =>
  Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(extra)])

describe('toStoredPdf', () => {
  it('accepts a PDF and reports its size and name', () => {
    const content = pdf()
    expect(
      toStoredPdf({ buffer: content, originalname: 'Brosur.pdf' }),
    ).toEqual({
      content,
      fileName: 'Brosur.pdf',
      sizeBytes: content.length,
    })
  })

  it.each([
    ['missing upload', undefined],
    ['empty file', { buffer: Buffer.alloc(0), originalname: 'a.pdf' }],
    [
      'a file without the PDF header',
      { buffer: Buffer.from('PK\u0003\u0004zip'), originalname: 'a.pdf' },
    ],
    [
      'a header that is not at the start',
      { buffer: Buffer.from(' %PDF-1.7'), originalname: 'a.pdf' },
    ],
    [
      'a file over the limit',
      {
        buffer: Buffer.concat([
          Buffer.from('%PDF-'),
          Buffer.alloc(MAX_UPLOAD_BYTES),
        ]),
        originalname: 'a.pdf',
      },
    ],
  ])('refuses %s', (_name, upload) => {
    expect(() => toStoredPdf(upload)).toThrow(
      new BadRequestException(PDF_REJECTED),
    )
  })

  it('accepts a file of exactly the limit', () => {
    const content = Buffer.concat([
      Buffer.from('%PDF-'),
      Buffer.alloc(MAX_UPLOAD_BYTES - 5),
    ])
    expect(
      toStoredPdf({ buffer: content, originalname: 'a.pdf' }).sizeBytes,
    ).toBe(MAX_UPLOAD_BYTES)
  })

  it('keeps only the base name and restores UTF-8 names that multer read as latin1', () => {
    const original = 'Formulir Pendaftaran Ünggulan.pdf'
    const asMulterSees = Buffer.from(original, 'utf8').toString('latin1')
    expect(
      toStoredPdf({
        buffer: pdf(),
        originalname: `C:\\Users\\a\\${asMulterSees}`,
      }).fileName,
    ).toBe(original)
    expect(
      toStoredPdf({ buffer: pdf(), originalname: '../../etc/brosur.pdf' })
        .fileName,
    ).toBe('brosur.pdf')
  })

  it('falls back to a fixed name and caps the length', () => {
    expect(toStoredPdf({ buffer: pdf(), originalname: '   ' }).fileName).toBe(
      'berkas.pdf',
    )
    expect(
      toStoredPdf({ buffer: pdf(), originalname: `${'a'.repeat(300)}.pdf` })
        .fileName,
    ).toHaveLength(255)
  })
})
