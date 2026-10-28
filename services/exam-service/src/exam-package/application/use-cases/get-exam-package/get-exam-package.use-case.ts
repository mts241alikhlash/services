import { Injectable, NotFoundException } from '@nestjs/common'
import { IQuestionRepository } from '../../../../question/domain/repositories/question.repository.js'
import { toPlainSummary } from '../../../../shared/helpers/plain-summary.helper.js'
import type { ExamPackageView } from '../../../domain/entities/exam-package.entity.js'
import { IExamPackageRepository } from '../../../domain/repositories/exam-package.repository.js'

@Injectable()
export class GetExamPackageUseCase {
  constructor(
    private readonly packages: IExamPackageRepository,
    private readonly questions: IQuestionRepository,
  ) {}

  async execute(id: string): Promise<ExamPackageView> {
    const found = await this.packages.findById(id)
    if (found === null) throw new NotFoundException('Paket tidak ditemukan')

    const pinned = await this.questions.findPinned(
      found.items.map((item) => ({
        questionId: item.questionId,
        number: item.questionVersion,
      })),
    )
    const byKey = new Map(
      pinned.map((row) => [`${row.questionId}:${row.number}`, row]),
    )

    return {
      ...found,
      items: found.items.map((item) => {
        const row = byKey.get(`${item.questionId}:${item.questionVersion}`)
        if (row === undefined) {
          throw new NotFoundException('Versi soal pada paket tidak ditemukan')
        }
        return {
          ...item,
          type: row.type,
          summary: toPlainSummary(row.bodyHtml),
          points: row.points,
        }
      }),
    }
  }
}
