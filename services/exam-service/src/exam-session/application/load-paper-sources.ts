import { NotFoundException } from '@nestjs/common'
import { IExamPackageRepository } from '../../exam-package/domain/repositories/exam-package.repository.js'
import { IExamScheduleRepository } from '../../exam-schedule/domain/repositories/exam-schedule.repository.js'
import { IQuestionRepository } from '../../question/domain/repositories/question.repository.js'
import type { PaperSource } from '../domain/policies/build-paper.policy.js'

export async function loadPaperSources(
  schedules: IExamScheduleRepository,
  packages: IExamPackageRepository,
  questions: IQuestionRepository,
  scheduleId: string,
): Promise<PaperSource[]> {
  const schedule = await schedules.findById(scheduleId)
  if (schedule === null) {
    throw new NotFoundException('Jadwal ujian tidak ditemukan')
  }
  const pkg = await packages.findById(schedule.packageId)
  if (pkg === null) throw new NotFoundException('Paket soal tidak ditemukan')
  const pinned = await questions.findPinned(
    pkg.items.map((item) => ({
      questionId: item.questionId,
      number: item.questionVersion,
    })),
  )
  return pinned.map((question) => ({
    questionId: question.questionId,
    type: question.type,
    bodyHtml: question.bodyHtml,
    content: question.content,
    points: question.points,
  }))
}
