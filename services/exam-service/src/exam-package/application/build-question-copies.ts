import { NotFoundException } from '@nestjs/common'
import {
  IQuestionRepository,
  type NewQuestionInput,
} from '../../question/domain/repositories/question.repository.js'
import type { ExamPackageDetail } from '../domain/entities/exam-package.entity.js'

export async function buildQuestionCopies(
  questions: IQuestionRepository,
  source: ExamPackageDetail,
  questionIds: string[],
  target: { id: string; subjectId: string; gradeId: string },
  authorEmployeeId: string,
  createdById: string,
): Promise<NewQuestionInput[]> {
  const pinOf = new Map(
    source.items.map((item) => [item.questionId, item.questionVersion]),
  )
  const pins = questionIds.map((questionId) => {
    const number = pinOf.get(questionId)
    if (number === undefined) {
      throw new NotFoundException('Soal tidak ditemukan di paket asal')
    }
    return { questionId, number }
  })
  const found = new Map(
    (await questions.findPinned(pins)).map((row) => [row.questionId, row]),
  )

  return pins.map<NewQuestionInput>((pin) => {
    const row = found.get(pin.questionId)
    if (row === undefined) {
      throw new NotFoundException('Soal tidak ditemukan di paket asal')
    }
    return {
      packageId: target.id,
      subjectId: target.subjectId,
      gradeId: target.gradeId,
      authorEmployeeId,
      type: row.type,
      createdById,
      bodyHtml: row.bodyHtml,
      content: row.content,
      points: row.points,
      copiedFromQuestionId: pin.questionId,
      copiedFromVersion: pin.number,
    }
  })
}
