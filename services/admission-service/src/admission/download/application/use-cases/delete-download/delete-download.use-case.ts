import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { IAdmissionDownloadRepository } from '../../../domain/repositories/admission-download-repository.js'
import { IAdmissionDownloadStorage } from '../../../domain/repositories/admission-download-storage.port.js'

@Injectable()
export class DeleteDownloadUseCase {
  private readonly logger = new Logger(DeleteDownloadUseCase.name)

  constructor(
    private readonly repository: IAdmissionDownloadRepository,
    private readonly storage: IAdmissionDownloadStorage,
  ) {}

  async execute(id: string) {
    const download = await this.repository.findById(id)
    if (!download) throw new NotFoundException('Berkas tidak ditemukan')
    await this.repository.delete(id)
    try {
      await this.storage.remove(download.fileKey)
    } catch (error) {
      this.logger.warn(
        `Could not remove ${download.fileKey}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
}
