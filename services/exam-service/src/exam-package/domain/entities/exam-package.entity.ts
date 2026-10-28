import type { QuestionType } from '../../../question/domain/value-objects/question-content.js'

export const EXAM_PACKAGE_STATUSES = ['DRAFT', 'LOCKED'] as const

export type ExamPackageStatus = (typeof EXAM_PACKAGE_STATUSES)[number]

export interface PackageItem {
  questionId: string
  questionVersion: number
  position: number
}

export interface ExamPackage {
  id: string
  title: string
  subjectId: string
  gradeId: string
  status: ExamPackageStatus
  lockedAt: Date | null
  createdById: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface ExamPackageDetail extends ExamPackage {
  items: PackageItem[]
}

export interface ExamPackageSummary extends ExamPackage {
  itemCount: number
}

export interface PackageItemView extends PackageItem {
  type: QuestionType
  summary: string
  points: number
}

export interface ExamPackageView extends ExamPackage {
  items: PackageItemView[]
}
