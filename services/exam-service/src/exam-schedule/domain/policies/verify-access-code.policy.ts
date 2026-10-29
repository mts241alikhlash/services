import { timingSafeEqual } from 'node:crypto'
import { deriveAccessCode } from './derive-access-code.policy.js'

export function verifyAccessCode(
  secret: string,
  scheduleId: string,
  rotation: number,
  given: string,
): boolean {
  const expected = Buffer.from(deriveAccessCode(secret, scheduleId, rotation))
  const actual = Buffer.from(given.trim().toUpperCase())
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
