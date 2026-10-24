import { BadRequestException } from '@nestjs/common'
import JSZip from 'jszip'

const MAX_ENTRIES = 1000
const MAX_EXPANDED_BYTES = 60 * 1024 * 1024

interface DeclaredEntry {
  _data?: { uncompressedSize?: number }
}

export async function assertSafeArchive(buffer: Buffer): Promise<void> {
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(buffer)
  } catch {
    throw new BadRequestException('Isi berkas tidak sesuai dengan jenisnya')
  }

  const entries = Object.values(zip.files) as unknown as DeclaredEntry[]
  if (entries.length > MAX_ENTRIES) {
    throw new BadRequestException('Berkas berisi terlalu banyak bagian')
  }

  const expanded = entries.reduce(
    (total, entry) => total + (entry._data?.uncompressedSize ?? 0),
    0,
  )
  if (expanded > MAX_EXPANDED_BYTES) {
    throw new BadRequestException('Isi berkas terlalu besar setelah diekstrak')
  }
}
