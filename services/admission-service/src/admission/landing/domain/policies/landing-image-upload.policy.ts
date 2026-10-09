import { BadRequestException } from '@nestjs/common'
import { MAX_UPLOAD_BYTES } from '../../../../core/upload/upload-limits.js'

export const LANDING_IMAGE_REJECTED =
  'Berkas harus gambar JPG, PNG, atau WebP dan maksimal 5 MB'

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

function startsWith(buffer: Buffer, bytes: number[]) {
  return bytes.every((byte, index) => buffer[index] === byte)
}

function isWebp(buffer: Buffer) {
  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buffer.subarray(8, 12).toString('latin1') === 'WEBP'
  )
}

export function assertLandingImage(buffer: Buffer | undefined): void {
  if (
    !buffer ||
    buffer.length === 0 ||
    buffer.length > MAX_UPLOAD_BYTES ||
    !(
      startsWith(buffer, [0xff, 0xd8, 0xff]) ||
      startsWith(buffer, PNG_SIGNATURE) ||
      isWebp(buffer)
    )
  ) {
    throw new BadRequestException(LANDING_IMAGE_REJECTED)
  }
}
