import { BadRequestException } from '@nestjs/common'

export const MAX_TITLE_LENGTH = 200

export function normalizeTitle(title: string): string {
  const trimmed = title.trim()
  if (trimmed.length === 0) {
    throw new BadRequestException('Judul paket wajib diisi')
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new BadRequestException('Judul paket maksimal 200 karakter')
  }
  return trimmed
}
