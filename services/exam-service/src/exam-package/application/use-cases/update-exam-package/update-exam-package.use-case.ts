import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IQuestionRepository } from '../../../../question/domain/repositories/question.repository.js'
import type { ExamPackageDetail } from '../../../domain/entities/exam-package.entity.js'
import { IExamPackageRepository } from '../../../domain/repositories/exam-package.repository.js'
import { buildPackageItems, normalizeTitle } from '../../build-package-items.js'

export const LOCKED_MESSAGE =
  'Paket sudah dijadwalkan dan tidak bisa diubah. Salin paket untuk membuat versi baru'

@Injectable()
export class UpdateExamPackageUseCase {
  constructor(
    private readonly packages: IExamPackageRepository,
    private readonly questions: IQuestionRepository,
  ) {}

  async execute(
    id: string,
    input: { title: string; questionIds: string[] },
  ): Promise<ExamPackageDetail> {
    const existing = await this.packages.findById(id)
    if (existing === null) throw new NotFoundException('Paket tidak ditemukan')
    if (existing.status !== 'DRAFT') throw new ConflictException(LOCKED_MESSAGE)

    const title = normalizeTitle(input.title)
    const items = await buildPackageItems(
      this.questions,
      existing,
      input.questionIds,
      existing.items,
    )
    const updated = await this.packages.replaceDraftItems(id, { title, items })
    if (updated === null) throw new ConflictException(LOCKED_MESSAGE)
    return updated
  }
}
