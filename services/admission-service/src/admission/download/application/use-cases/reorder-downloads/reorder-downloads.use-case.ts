import { BadRequestException, Injectable } from '@nestjs/common'
import { IAdmissionDownloadRepository } from '../../../domain/repositories/admission-download-repository.js'

@Injectable()
export class ReorderDownloadsUseCase {
  constructor(private readonly repository: IAdmissionDownloadRepository) {}

  async execute(ids: string[]) {
    const existing = new Set((await this.repository.findAll()).map((d) => d.id))
    const given = new Set(ids)
    if (
      given.size !== ids.length ||
      given.size !== existing.size ||
      ids.some((id) => !existing.has(id))
    ) {
      throw new BadRequestException('Urutan berkas tidak lengkap')
    }
    await this.repository.reorder(ids)
    return this.repository.findAll()
  }
}
