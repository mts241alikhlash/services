import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IExamPackageRepository } from '../../../domain/repositories/exam-package.repository.js'

@Injectable()
export class DeleteExamPackageUseCase {
  constructor(private readonly packages: IExamPackageRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.packages.findById(id)
    if (existing === null) throw new NotFoundException('Paket tidak ditemukan')
    if (existing.status !== 'DRAFT') {
      throw new ConflictException(
        'Paket yang sudah dijadwalkan tidak bisa dihapus',
      )
    }
    if (!(await this.packages.softDeleteDraft(id))) {
      throw new ConflictException(
        'Paket yang sudah dijadwalkan tidak bisa dihapus',
      )
    }
  }
}
