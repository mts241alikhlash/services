import { documentTypeCode } from './document-type-code.policy.js'

describe('documentTypeCode', () => {
  it('turns a name into an uppercase ASCII code', () => {
    expect(documentTypeCode('Surat Keterangan Sehat', new Set())).toBe(
      'SURAT_KETERANGAN_SEHAT',
    )
    expect(documentTypeCode('Pas Foto 3×4', new Set())).toBe('PAS_FOTO_3_4')
    expect(documentTypeCode('Rapor Kelas 5–6', new Set())).toBe('RAPOR_KELAS_5_6')
    expect(documentTypeCode('Ijazah/SKL (SD)', new Set())).toBe('IJAZAH_SKL_SD')
  })

  it('falls back to BERKAS when nothing is left', () => {
    expect(documentTypeCode('!!! —', new Set())).toBe('BERKAS')
  })

  it('keeps the code within 30 characters', () => {
    const code = documentTypeCode(
      'Surat Keterangan Tidak Mampu dari Kelurahan',
      new Set(),
    )
    expect(code).toBe('SURAT_KETERANGAN_TIDAK_MAMPU_D')
    expect(code.length).toBeLessThanOrEqual(30)
  })

  it('adds a numeric suffix on a clash, still within 30 characters', () => {
    expect(documentTypeCode('Photo', new Set(['PHOTO']))).toBe('PHOTO_2')
    expect(documentTypeCode('Photo', new Set(['PHOTO', 'PHOTO_2']))).toBe(
      'PHOTO_3',
    )
    const long = 'SURAT_KETERANGAN_TIDAK_MAMPU_D'
    expect(
      documentTypeCode('Surat Keterangan Tidak Mampu dari Kelurahan', new Set([long])),
    ).toBe('SURAT_KETERANGAN_TIDAK_MAMPU_2')
  })
})
