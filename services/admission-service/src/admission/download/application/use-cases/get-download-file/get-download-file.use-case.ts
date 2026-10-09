import { Injectable, NotFoundException } from '@nestjs/common'
import { IAdmissionDownloadRepository } from '../../../domain/repositories/admission-download-repository.js'
import { IAdmissionDownloadStorage } from '../../../domain/repositories/admission-download-storage.port.js'

@Injectable()
export class GetDownloadFileUseCase {
  constructor(
    private readonly repository: IAdmissionDownloadRepository,
    private readonly storage: IAdmissionDownloadStorage,
  ) {}

  async execute(id: string) {
    const download = await this.repository.findById(id)
    if (!download?.isActive) {
      throw new NotFoundException('Berkas tidak ditemukan')
    }
    const { stream } = await this.storage.read(download.fileKey)
    return { download, stream }
  }
}
