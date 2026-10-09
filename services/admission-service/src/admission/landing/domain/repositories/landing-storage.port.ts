import type { Readable } from 'node:stream'

export abstract class ILandingStorage {
  abstract put(key: string, content: Buffer): Promise<void>
  abstract read(key: string): Promise<{ stream: Readable }>
  abstract remove(key: string): Promise<void>
}
