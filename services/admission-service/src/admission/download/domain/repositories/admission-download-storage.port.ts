import type { Readable } from 'node:stream'

export abstract class IAdmissionDownloadStorage {
  abstract put(key: string, content: Buffer): Promise<void>
  abstract read(key: string): Promise<{ stream: Readable }>
  abstract remove(key: string): Promise<void>
}
