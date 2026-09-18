import { Injectable } from '@nestjs/common'
import * as path from 'path'
import { AppKey } from '../../../../shared/domain/enums/app-key.enum.js'
import { StorageKeyBuilder } from '../../../../core/storage/storage-key-builder.service.js'
import { StorageService } from '../../../../core/storage/storage.service.js'
import type {
  AdmissionStoredFile,
  AdmissionUploadFile,
} from '../../domain/entities/admission-file.entity.js'
import { IAdmissionFileStorage } from '../../domain/repositories/admission-file-storage.js'

@Injectable()
export class AdmissionFileStorage extends IAdmissionFileStorage {
  constructor(
    private readonly storage: StorageService,
    private readonly keyBuilder: StorageKeyBuilder,
  ) {
    super()
  }

  async save(
    file: AdmissionUploadFile,
    segments: string[],
  ): Promise<AdmissionStoredFile> {
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    const storageKey = this.keyBuilder.build(
      AppKey.ADMISSION,
      segments,
      filename,
    )
    await this.storage.uploadFile(file.buffer, storageKey, file.mimetype)
    return { filename, storageKey }
  }
}
