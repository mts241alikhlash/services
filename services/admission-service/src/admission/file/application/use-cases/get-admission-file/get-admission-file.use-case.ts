import { Injectable, NotFoundException } from '@nestjs/common'
import { IAdmissionFileContent } from '../../../domain/repositories/admission-file-content.port.js'
import { IAdmissionFileRepository } from '../../../domain/repositories/admission-file.repository.js'

@Injectable()
export class GetAdmissionFileUseCase {
  constructor(
    private readonly files: IAdmissionFileRepository,
    private readonly content: IAdmissionFileContent,
  ) {}

  async execute(fileId: string) {
    const file = await this.files.findServable(fileId)
    if (!file) throw new NotFoundException('Berkas tidak ditemukan')
    const { stream } = await this.content.read(file.storageKey)
    return { file, stream }
  }
}
