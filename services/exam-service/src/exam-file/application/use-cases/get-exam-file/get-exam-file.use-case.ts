import { Injectable, NotFoundException } from '@nestjs/common'
import type { Readable } from 'node:stream'
import type { ExamFile } from '../../../domain/entities/exam-file.entity.js'
import { IExamFileRepository } from '../../../domain/repositories/exam-file.repository.js'
import { IExamFileStorage } from '../../../domain/repositories/exam-file-storage.js'

@Injectable()
export class GetExamFileUseCase {
  constructor(
    private readonly files: IExamFileRepository,
    private readonly storage: IExamFileStorage,
  ) {}

  async execute(id: string): Promise<{ file: ExamFile; stream: Readable }> {
    const file = await this.files.findById(id)
    if (!file) throw new NotFoundException('Gambar tidak ditemukan')

    const { stream } = await this.storage.read(file.storageKey)
    return { file, stream }
  }
}
