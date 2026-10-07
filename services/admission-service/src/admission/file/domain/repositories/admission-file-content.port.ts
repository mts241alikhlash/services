import type { Readable } from 'node:stream'

export abstract class IAdmissionFileContent {
  abstract read(storageKey: string): Promise<{ stream: Readable }>
}
