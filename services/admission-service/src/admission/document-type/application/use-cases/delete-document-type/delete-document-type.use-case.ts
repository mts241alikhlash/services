import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IAdmissionDocumentTypeRepository } from '../../../domain/repositories/admission-document-type-repository.js'

@Injectable()
export class DeleteDocumentTypeUseCase {
  constructor(private readonly repository: IAdmissionDocumentTypeRepository) {}

  async execute(id: string) {
    const type = await this.repository.findById(id)
    if (!type) throw new NotFoundException('Jenis berkas tidak ditemukan')
    if (type.documentCount > 0) {
      throw new ConflictException(
        'Jenis berkas sudah dipakai, nonaktifkan saja',
      )
    }
    await this.repository.delete(id)
  }
}
