import { Injectable } from '@nestjs/common'
import { StorageService } from '../../../../core/storage/storage.service.js'
import { IAdmissionDownloadStorage } from '../../domain/repositories/admission-download-storage.port.js'

@Injectable()
export class StorageDownloadStorage extends IAdmissionDownloadStorage {
  constructor(private readonly storage: StorageService) {
    super()
  }

  async put(key: string, content: Buffer) {
    await this.storage.uploadFile(content, key, 'application/pdf')
  }

  async read(key: string) {
    const { stream } = await this.storage.getObject(key)
    return { stream }
  }

  async remove(key: string) {
    await this.storage.deleteFile(key)
  }
}
