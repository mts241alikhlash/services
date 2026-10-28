import type { Prisma } from '../../../../generated/prisma/client.js'
import type {
  ExamPackageDetail,
  ExamPackageSummary,
  PackageItem,
} from '../../../domain/entities/exam-package.entity.js'

export const DETAIL_INCLUDE = {
  items: { orderBy: { position: 'asc' } },
} satisfies Prisma.ExamPackageInclude

export const SUMMARY_INCLUDE = {
  _count: { select: { items: true } },
} satisfies Prisma.ExamPackageInclude

type ItemRow = Prisma.ExamPackageItemGetPayload<object>
type DetailRow = Prisma.ExamPackageGetPayload<{
  include: typeof DETAIL_INCLUDE
}>
type SummaryRow = Prisma.ExamPackageGetPayload<{
  include: typeof SUMMARY_INCLUDE
}>

function toItem(row: ItemRow): PackageItem {
  return {
    questionId: row.questionId,
    questionVersion: row.questionVersion,
    position: row.position,
  }
}

function toBase(row: Prisma.ExamPackageGetPayload<object>) {
  return {
    id: row.id,
    title: row.title,
    subjectId: row.subjectId,
    gradeId: row.gradeId,
    status: row.status,
    lockedAt: row.lockedAt,
    createdById: row.createdById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  }
}

export function toDetail(row: DetailRow): ExamPackageDetail {
  return { ...toBase(row), items: row.items.map(toItem) }
}

export function toSummary(row: SummaryRow): ExamPackageSummary {
  return { ...toBase(row), itemCount: row._count.items }
}
