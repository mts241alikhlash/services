import { BadRequestException, Injectable } from '@nestjs/common'
import { IAdmissionDocumentTypeRepository } from '../../../domain/repositories/admission-document-type-repository.js'

@Injectable()
export class ReorderDocumentTypesUseCase {
  constructor(private readonly repository: IAdmissionDocumentTypeRepository) {}

  async execute(ids: string[]) {
    const existing = new Set((await this.repository.findAll()).map((t) => t.id))
    const given = new Set(ids)
    if (
      given.size !== ids.length ||
      given.size !== existing.size ||
      ids.some((id) => !existing.has(id))
    ) {
      throw new BadRequestException('Urutan jenis berkas tidak lengkap')
    }
    await this.repository.reorder(ids)
    return this.repository.findAll()
  }
}
