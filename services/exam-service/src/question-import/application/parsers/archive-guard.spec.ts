import { BadRequestException } from '@nestjs/common'
import JSZip from 'jszip'
import { assertSafeArchive } from './archive-guard.js'

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
