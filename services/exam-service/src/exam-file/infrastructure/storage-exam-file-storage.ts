import { Injectable } from '@nestjs/common'
import { StorageKeyBuilder } from '../../core/storage/storage-key-builder.service.js'
import { StorageService } from '../../core/storage/storage.service.js'
import { AppKey } from '../../shared/domain/enums/app-key.enum.js'
import { IExamFileStorage } from '../domain/repositories/exam-file-storage.js'

@Injectable()
export class StorageExamFileStorage extends IExamFileStorage {
  constructor(
    private readonly storage: StorageService,
    private readonly keys: StorageKeyBuilder,
  ) {
    super()
  }

  async put(
    fileId: string,
    content: Buffer,
    mimeType: string,
  ): Promise<string> {
    const key = this.keys.build(AppKey.EXAM, ['questions'], fileId)
    return this.storage.uploadFile(content, key, mimeType)
  }

  async read(storageKey: string) {
    const { stream } = await this.storage.getObject(storageKey)
    return { stream }
  }
}
