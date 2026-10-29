import { createHmac } from 'node:crypto'

export const ACCESS_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const ACCESS_CODE_LENGTH = 6

const BYTE_RANGE = 256
const UNBIASED_LIMIT = BYTE_RANGE - (BYTE_RANGE % ACCESS_CODE_ALPHABET.length)

export function deriveAccessCode(
  secret: string,
  scheduleId: string,
  rotation: number,
): string {
  let code = ''
  for (let block = 0; code.length < ACCESS_CODE_LENGTH; block++) {
    const message =
      block === 0
        ? `${scheduleId}:${rotation}`
        : `${scheduleId}:${rotation}:${block}`
    for (const byte of createHmac('sha256', secret).update(message).digest()) {
      if (byte >= UNBIASED_LIMIT) continue
      code += ACCESS_CODE_ALPHABET[byte % ACCESS_CODE_ALPHABET.length]
      if (code.length === ACCESS_CODE_LENGTH) break
    }
  }
  return code
}
