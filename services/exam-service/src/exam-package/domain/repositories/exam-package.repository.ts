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
} from '../entities/exam-package.entity.js'

export interface ExamPackageListQuery {
  page: number
  limit: number
  subjectId?: string
  gradeId?: string
  status?: ExamPackageStatus
  search?: string
}

export interface NewExamPackage {
  title: string
  subjectId: string
  gradeId: string
  createdById: string
  items: PackageItem[]
}

export interface DraftFields {
  title: string
  items: PackageItem[]
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
  abstract replaceDraftItems(
    id: string,
    fields: DraftFields,
  ): Promise<ExamPackageDetail | null>
  abstract softDeleteDraft(id: string): Promise<boolean>
  abstract setStatusIf(
    id: string,
    from: ExamPackageStatus[],
    to: ExamPackageStatus,
  ): Promise<boolean>
  abstract addQuestion(
    id: string,
    edit: PackageEdit,
    question: NewQuestionInput,
  ): Promise<ExamPackageDetail | null>
  abstract changeQuestion(
    id: string,
    edit: PackageEdit,
    questionId: string,
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
