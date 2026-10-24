import { randomUUID } from 'node:crypto'
import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common'
import type { ExamFile } from '../../../domain/entities/exam-file.entity.js'
import {
  detectImageType,
  EXAM_IMAGE_MAX_BYTES,
} from '../../../domain/policies/detect-image-type.policy.js'
import { IExamFileRepository } from '../../../domain/repositories/exam-file.repository.js'
import { IExamFileStorage } from '../../../domain/repositories/exam-file-storage.js'
import type { UploadExamFileInput } from './upload-exam-file.input.js'

@Injectable()
export class UploadExamFileUseCase {
  constructor(
    private readonly files: IExamFileRepository,
    private readonly storage: IExamFileStorage,
  ) {}

  async execute(input: UploadExamFileInput): Promise<ExamFile> {
    if (input.size > EXAM_IMAGE_MAX_BYTES) {
      throw new PayloadTooLargeException('Ukuran gambar maksimal 2 MB')
    }
    const mimeType = detectImageType(input.buffer)
    if (mimeType === null) {
      throw new BadRequestException('Gambar harus JPG, PNG, atau WebP')
    }

    const id = randomUUID()
    const storageKey = await this.storage.put(id, input.buffer, mimeType)
    return this.files.create({
      id,
      storageKey,
      mimeType,
      sizeBytes: input.buffer.length,
      originalName: input.originalName,
      uploadedById: input.uploadedById,
    })
  }
}
