import { BadRequestException } from '@nestjs/common'
import JSZip from 'jszip'
import { assertSafeArchive, normalizeArchive } from './archive-guard.js'

jest.setTimeout(60_000)

async function zipOf(entries: Record<string, Buffer>): Promise<Buffer> {
  const zip = new JSZip()
  for (const [name, content] of Object.entries(entries)) zip.file(name, content)
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}

describe('assertSafeArchive', () => {
  it('accepts an ordinary archive', async () => {
    await expect(
      assertSafeArchive(await zipOf({ 'a.xml': Buffer.from('<a/>') })),
    ).resolves.toBeUndefined()
  })

  it('refuses an archive that expands far beyond its size', async () => {
    const bomb = await zipOf({ 'big.xml': Buffer.alloc(64 * 1024 * 1024) })

    expect(bomb.length).toBeLessThan(1024 * 1024)
    await expect(assertSafeArchive(bomb)).rejects.toThrow(
      new BadRequestException('Isi berkas terlalu besar setelah diekstrak'),
    )
  })

  it('refuses a bomb whose headers lie about the expanded size', async () => {
    const honest = await zipOf({ 'big.xml': Buffer.alloc(64 * 1024 * 1024) })
    const forged = Buffer.from(honest)
    for (const [signature, offset] of [
      [0x04034b50, 22],
      [0x02014b50, 24],
    ] as const) {
      for (let at = 0; at + offset + 4 <= forged.length; at++) {
        if (forged.readUInt32LE(at) === signature) {
          forged.writeUInt32LE(100, at + offset)
        }
      }
    }

    await expect(assertSafeArchive(forged)).rejects.toThrow(
      new BadRequestException('Isi berkas terlalu besar setelah diekstrak'),
    )
  })

  it('refuses one XML part that expands past 20 MB, but lets a large picture through', async () => {
    const xml = await zipOf({
      'word/document.xml': Buffer.alloc(24 * 1024 * 1024),
    })
    const picture = await zipOf({
      'word/document.xml': Buffer.from('<w:document/>'),
      'word/media/image1.png': Buffer.alloc(24 * 1024 * 1024),
    })

    await expect(assertSafeArchive(xml)).rejects.toThrow(
      new BadRequestException('Isi berkas terlalu besar setelah diekstrak'),
    )
    await expect(assertSafeArchive(picture)).resolves.toBeUndefined()
  })

  it('refuses an archive with too many entries', async () => {
    const entries: Record<string, Buffer> = {}
    for (let i = 0; i < 1001; i++) entries[`f${i}.xml`] = Buffer.from('x')

    await expect(assertSafeArchive(await zipOf(entries))).rejects.toThrow(
      new BadRequestException('Berkas berisi terlalu banyak bagian'),
    )
  })

  it('refuses something that is not an archive', async () => {
    await expect(
      assertSafeArchive(Buffer.from('PK\x03\x04junk')),
    ).rejects.toThrow(
      new BadRequestException('Isi berkas tidak sesuai dengan jenisnya'),
    )
  })
})

describe('normalizeArchive', () => {
  it('rebuilds the archive from the entries it inflated itself, keeping names and bytes', async () => {
    const original = await zipOf({
      '[Content_Types].xml': Buffer.from('<Types/>'),
      'xl/worksheets/sheet1.xml': Buffer.from('<worksheet>مَا</worksheet>'),
    })

    const normalized = await normalizeArchive(original)
    const reread = await JSZip.loadAsync(normalized)

    expect(Object.keys(reread.files).sort()).toEqual([
      '[Content_Types].xml',
      'xl/worksheets/sheet1.xml',
    ])
    expect(await reread.file('xl/worksheets/sheet1.xml')!.async('string')).toBe(
      '<worksheet>مَا</worksheet>',
    )
  })

  it('refuses the same bombs as the guard, including forged headers', async () => {
    const honest = await zipOf({ 'big.xml': Buffer.alloc(64 * 1024 * 1024) })
    const forged = Buffer.from(honest)
    for (const [signature, offset] of [
      [0x04034b50, 22],
      [0x02014b50, 24],
    ] as const) {
      for (let at = 0; at + offset + 4 <= forged.length; at++) {
        if (forged.readUInt32LE(at) === signature) {
          forged.writeUInt32LE(100, at + offset)
        }
      }
    }

    await expect(normalizeArchive(forged)).rejects.toThrow(
      new BadRequestException('Isi berkas terlalu besar setelah diekstrak'),
    )
    await expect(
      normalizeArchive(Buffer.from('PK\x03\x04junk')),
    ).rejects.toThrow(
      new BadRequestException('Isi berkas tidak sesuai dengan jenisnya'),
    )
  })
})
