import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IExamPackageRepository } from '../../../domain/repositories/exam-package.repository.js'

const KEPT_MESSAGE =
  'Paket yang menunggu tinjauan atau sudah dijadwalkan tidak bisa dihapus'

@Injectable()
export class DeleteExamPackageUseCase {
  constructor(private readonly packages: IExamPackageRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.packages.findById(id)
    if (existing === null) throw new NotFoundException('Paket tidak ditemukan')
    if (!(await this.packages.softDeleteUnscheduled(id))) {
      throw new ConflictException(KEPT_MESSAGE)
    }
  }
}
