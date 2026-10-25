import { ConflictException } from '@nestjs/common'
import type { QuestionStatus } from '../value-objects/question-content.js'

export function assertCanSubmit(status: QuestionStatus): void {
  if (status === 'DRAFT' || status === 'RETURNED') return
  throw new ConflictException(
    status === 'SUBMITTED'
      ? 'Soal sudah diajukan'
      : 'Soal sudah disetujui, ubah soal untuk membuat versi baru',
  )
}

export function assertCanApprove(status: QuestionStatus): void {
  if (status === 'SUBMITTED') return
  throw new ConflictException('Hanya soal yang diajukan yang bisa disetujui')
}

export function assertCanReturn(status: QuestionStatus): void {
  if (status === 'SUBMITTED') return
  throw new ConflictException('Hanya soal yang diajukan yang bisa dikembalikan')
}
