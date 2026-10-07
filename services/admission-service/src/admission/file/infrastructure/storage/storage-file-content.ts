import { Injectable } from '@nestjs/common'
import { StorageService } from '../../../../core/storage/storage.service.js'
import { IAdmissionFileContent } from '../../domain/repositories/admission-file-content.port.js'

@Injectable()
export class StorageFileContent extends IAdmissionFileContent {
  constructor(private readonly storage: StorageService) {
    super()
  }

  async read(storageKey: string) {
    const { stream } = await this.storage.getObject(storageKey)
    return { stream }
  }
}
