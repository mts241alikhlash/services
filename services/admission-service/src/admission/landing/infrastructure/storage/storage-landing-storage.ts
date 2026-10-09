import { Injectable } from '@nestjs/common'
import { StorageService } from '../../../../core/storage/storage.service.js'
import { ILandingStorage } from '../../domain/repositories/landing-storage.port.js'

@Injectable()
export class StorageLandingStorage extends ILandingStorage {
  constructor(private readonly storage: StorageService) {
    super()
  }

  async put(key: string, content: Buffer) {
    await this.storage.uploadFile(content, key, 'image/webp')
  }

  async read(key: string) {
    const { stream } = await this.storage.getObject(key)
    return { stream }
  }

  async remove(key: string) {
    await this.storage.deleteFile(key)
  }
}
