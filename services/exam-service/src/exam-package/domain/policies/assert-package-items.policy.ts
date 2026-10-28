import { BadRequestException } from '@nestjs/common'
import type { ApprovedQuestionRef } from '../../../question/domain/entities/question.entity.js'

export interface PackageTarget {
  subjectId: string
  gradeId: string
  questions: ApprovedQuestionRef[]
}

export function assertPackageItems(
  target: PackageTarget,
  requestedIds: string[],
  pinned: ReadonlySet<string> = new Set(),
): void {
  if (requestedIds.length === 0) {
    throw new BadRequestException('Paket harus berisi minimal satu soal')
  }
  if (new Set(requestedIds).size !== requestedIds.length) {
    throw new BadRequestException(
      'Soal yang sama tidak boleh dimasukkan dua kali',
    )
  }

  const byId = new Map(
    target.questions.map((question) => [question.id, question]),
  )
  for (const id of requestedIds) {
    if (pinned.has(id)) continue
    const question = byId.get(id)
    if (question?.deletedAt !== null) {
      throw new BadRequestException('Soal tidak ditemukan')
    }
    if (question.status !== 'APPROVED' || question.approvedVersion === null) {
      throw new BadRequestException(
        'Hanya soal yang sudah disetujui yang boleh masuk paket',
      )
    }
    if (
      question.subjectId !== target.subjectId ||
      question.gradeId !== target.gradeId
    ) {
      throw new BadRequestException(
        'Semua soal harus memiliki mapel dan tingkat yang sama dengan paket',
      )
    }
  }
}
