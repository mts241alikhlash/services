export type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp'

export const EXAM_IMAGE_MAX_BYTES = 2 * 1024 * 1024

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const JPEG = [0xff, 0xd8, 0xff]

function startsWith(buffer: Buffer, bytes: number[], offset = 0): boolean {
  return (
    buffer.length >= offset + bytes.length &&
    bytes.every((byte, index) => buffer[offset + index] === byte)
  )
}

function ascii(text: string): number[] {
  return [...text].map((char) => char.charCodeAt(0))
}

export function detectImageType(buffer: Buffer): ImageMime | null {
  if (startsWith(buffer, PNG)) return 'image/png'
  if (startsWith(buffer, JPEG)) return 'image/jpeg'
  if (
    startsWith(buffer, ascii('RIFF')) &&
    startsWith(buffer, ascii('WEBP'), 8)
  ) {
    return 'image/webp'
  }
  return null
}
