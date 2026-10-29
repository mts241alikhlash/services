import type { PaginatedResult } from '../../../shared/domain/interfaces/repository.interface.js'
import type {
  NewQuestionInput,
  VersionFields,
} from '../../../question/domain/repositories/question.repository.js'
import type {
  ExamPackageDetail,
  ExamPackageStatus,
  ExamPackageSummary,
  PackageItem,
  PackageQuestionNote,
  PackageReview,
  PackageReviewAction,
} from '../entities/exam-package.entity.js'

export interface ExamPackageListQuery {
  page: number
  limit: number
  subjectId?: string
  gradeId?: string
  status?: ExamPackageStatus
  search?: string
  visibleTo?: string
}

export interface NewExamPackage {
  title: string
  subjectId: string
  gradeId: string
  createdById: string
  items: PackageItem[]
}

export interface NewPackageReview {
  action: PackageReviewAction
  byUserId: string
  note: string | null
  questionNotes: PackageQuestionNote[]
}

export interface PackageEdit {
  expected: ExamPackageStatus
  next: ExamPackageStatus
}

export abstract class IExamPackageRepository {
  abstract findAll(
    query: ExamPackageListQuery,
  ): Promise<PaginatedResult<ExamPackageSummary>>
  abstract findById(id: string): Promise<ExamPackageDetail | null>
  abstract create(input: NewExamPackage): Promise<ExamPackageDetail>
  abstract softDeleteUnscheduled(id: string): Promise<boolean>
  abstract renamePackage(
    id: string,
    edit: PackageEdit,
    title: string,
  ): Promise<ExamPackageDetail | null>
  abstract transition(
    id: string,
    from: ExamPackageStatus[],
    to: ExamPackageStatus,
    review: NewPackageReview,
  ): Promise<boolean>
  abstract listReviews(id: string): Promise<PackageReview[]>
  abstract addQuestion(
    id: string,
    edit: PackageEdit,
    question: NewQuestionInput,
  ): Promise<ExamPackageDetail | null>
  abstract addQuestions(
    id: string,
    edit: PackageEdit,
    questions: NewQuestionInput[],
  ): Promise<ExamPackageDetail | null>
  abstract changeQuestion(
    id: string,
    edit: PackageEdit,
    questionId: string,
    expectedRevision: number,
    fields: VersionFields,
    createdById: string,
  ): Promise<ExamPackageDetail | null>
  abstract removeQuestion(
    id: string,
    edit: PackageEdit,
    questionId: string,
  ): Promise<ExamPackageDetail | null>
  abstract reorderQuestions(
    id: string,
    edit: PackageEdit,
    questionIds: string[],
  ): Promise<ExamPackageDetail | null>
}
