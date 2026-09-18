import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { Injectable } from '@nestjs/common'

const TOKEN_BYTES = 32

export interface IssuedDeviceToken {
  token: string
  hash: string
}

@Injectable()
export class DeviceTokenService {
  issue(): IssuedDeviceToken {
    const token = randomBytes(TOKEN_BYTES).toString('base64url')
    return { token, hash: this.hash(token) }
  }

  hash(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex')
  }

  matches(token: string, expectedHash: string): boolean {
    const actual = Buffer.from(this.hash(token), 'hex')
    const expected = Buffer.from(expectedHash, 'hex')

    if (actual.length !== expected.length) return false
    return timingSafeEqual(actual, expected)
  }
}
