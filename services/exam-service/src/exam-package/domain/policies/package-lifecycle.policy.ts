import { ConflictException, ForbiddenException } from '@nestjs/common'
import type { ExamPackageStatus } from '../entities/exam-package.entity.js'

const refuse = (action: string, status: ExamPackageStatus): never => {
  throw new ConflictException(
    `Paket berstatus ${status} dan tidak bisa ${action}`,
  )
}

export function assertEditable(status: ExamPackageStatus): ExamPackageStatus {
  if (status === 'DRAFT' || status === 'RETURNED') return status
  if (status === 'APPROVED') return 'DRAFT'
  return refuse('diubah', status)
}

export function assertCanSubmit(
  status: ExamPackageStatus,
  itemCount: number,
): void {
  if (status !== 'DRAFT' && status !== 'RETURNED') refuse('diajukan', status)
  if (itemCount === 0) {
    throw new ConflictException('Paket belum berisi soal')
  }
}

export function assertCanReview(status: ExamPackageStatus): void {
  if (status !== 'SUBMITTED') refuse('ditinjau', status)
}

export function assertCanSchedule(status: ExamPackageStatus): void {
  if (status !== 'APPROVED' && status !== 'LOCKED') {
    refuse('dijadwalkan', status)
  }
}

export function assertCanTakeFrom(status: ExamPackageStatus): void {
  if (status !== 'APPROVED' && status !== 'LOCKED') {
    refuse('dipakai untuk mengambil soal', status)
  }
}

export function assertCanChange(
  authorId: string,
  userId: string,
  canManageAll: boolean,
): void {
  if (authorId !== userId && !canManageAll) {
    throw new ForbiddenException('Paket ini disusun guru lain')
  }
}

export function assertNotOwnReview(authorId: string, reviewerId: string): void {
  if (authorId === reviewerId) {
    throw new ForbiddenException(
      'Anda tidak bisa menyetujui paket yang Anda susun sendiri',
    )
  }
}
