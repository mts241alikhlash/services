import { BadRequestException } from '@nestjs/common'
import JSZip from 'jszip'

const MAX_ENTRIES = 1000
const MAX_EXPANDED_BYTES = 60 * 1024 * 1024
const MAX_XML_BYTES = 20 * 1024 * 1024

const TOO_BIG = 'Isi berkas terlalu besar setelah diekstrak'

interface DeclaredEntry {
  _data?: { uncompressedSize?: number }
}

function isXml(name: string): boolean {
  return /\.(xml|rels)$/iu.test(name)
}

function inflateWithin(
  entry: JSZip.JSZipObject,
  remaining: number,
): Promise<number> {
  const limit = isXml(entry.name)
    ? Math.min(remaining, MAX_XML_BYTES)
    : remaining
  return new Promise((resolve, reject) => {
    const stream = entry.nodeStream()
    let seen = 0
    stream.on('data', (chunk: Buffer) => {
      seen += chunk.length
      if (seen > limit) {
        stream.pause()
        reject(new BadRequestException(TOO_BIG))
      }
    })
    stream.on('end', () => resolve(seen))
    stream.on('error', () =>
      reject(
        new BadRequestException('Isi berkas tidak sesuai dengan jenisnya'),
      ),
    )
  })
}

export async function assertSafeArchive(buffer: Buffer): Promise<void> {
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(buffer)
  } catch {
    throw new BadRequestException('Isi berkas tidak sesuai dengan jenisnya')
  }

  const entries = Object.values(zip.files)
  if (entries.length > MAX_ENTRIES) {
    throw new BadRequestException('Berkas berisi terlalu banyak bagian')
  }

  const declared = (entries as unknown as DeclaredEntry[]).reduce(
    (total, entry) => total + (entry._data?.uncompressedSize ?? 0),
    0,
  )
  if (declared > MAX_EXPANDED_BYTES) throw new BadRequestException(TOO_BIG)

  let expanded = 0
  for (const entry of entries) {
    if (entry.dir) continue
    expanded += await inflateWithin(entry, MAX_EXPANDED_BYTES - expanded)
  }
}
