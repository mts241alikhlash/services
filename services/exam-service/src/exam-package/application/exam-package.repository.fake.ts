import { randomUUID } from 'node:crypto'
import type { FakeQuestionRepository } from '../../question/application/question.repository.fake.js'
import type {
  NewQuestionInput,
  VersionFields,
} from '../../question/domain/repositories/question.repository.js'
import type {
  ExamPackageDetail,
  ExamPackageStatus,
  ExamPackageSummary,
  PackageReview,
} from '../domain/entities/exam-package.entity.js'
import {
  IExamPackageRepository,
  type DraftFields,
  type NewPackageReview,
  type PackageEdit,
  type ExamPackageListQuery,
  type NewExamPackage,
} from '../domain/repositories/exam-package.repository.js'

export class FakeExamPackageRepository extends IExamPackageRepository {
  readonly packages = new Map<string, ExamPackageDetail>()
  readonly reviews: PackageReview[] = []

  constructor(private readonly questions?: FakeQuestionRepository) {
    super()
  }

  findAll(query: ExamPackageListQuery) {
    const rows = [...this.packages.values()]
      .filter((row) => row.deletedAt === null)
      .filter((row) => !query.subjectId || row.subjectId === query.subjectId)
      .filter((row) => !query.gradeId || row.gradeId === query.gradeId)
      .filter((row) => !query.status || row.status === query.status)
      .filter((row) => !query.search || row.title.includes(query.search))
    const data: ExamPackageSummary[] = rows
      .slice((query.page - 1) * query.limit, query.page * query.limit)
      .map(({ items, ...row }) => ({ ...row, itemCount: items.length }))
    return Promise.resolve({
      data,
      total: rows.length,
      page: query.page,
      limit: query.limit,
    })
  }

  findById(id: string) {
    const row = this.packages.get(id)
    return Promise.resolve(row?.deletedAt === null ? row : null)
  }

  create(input: NewExamPackage) {
    const now = new Date()
    const row: ExamPackageDetail = {
      id: randomUUID(),
      title: input.title,
      subjectId: input.subjectId,
      gradeId: input.gradeId,
      status: 'DRAFT',
      lockedAt: null,
      createdById: input.createdById,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      items: input.items,
    }
    this.packages.set(row.id, row)
    return Promise.resolve(row)
  }

  replaceDraftItems(id: string, fields: DraftFields) {
    const row = this.packages.get(id)
    if (row?.status !== 'DRAFT' || row.deletedAt !== null) {
      return Promise.resolve(null)
    }
    const updated = {
      ...row,
      title: fields.title,
      items: fields.items,
      updatedAt: new Date(),
    }
    this.packages.set(id, updated)
    return Promise.resolve(updated)
  }

  softDeleteDraft(id: string) {
    const row = this.packages.get(id)
    if (row?.status !== 'DRAFT' || row.deletedAt !== null) {
      return Promise.resolve(false)
    }
    this.packages.set(id, { ...row, deletedAt: new Date() })
    return Promise.resolve(true)
  }

  lockForTest(id: string): void {
    const row = this.packages.get(id)
    if (row) {
      this.packages.set(id, { ...row, status: 'LOCKED', lockedAt: new Date() })
    }
  }

  transition(
    id: string,
    from: ExamPackageStatus[],
    to: ExamPackageStatus,
    review: NewPackageReview,
  ) {
    const row = this.packages.get(id)
    if (!row || row.deletedAt !== null || !from.includes(row.status)) {
      return Promise.resolve(false)
    }
    this.packages.set(id, { ...row, status: to, updatedAt: new Date() })
    this.reviews.push({
      id: randomUUID(),
      packageId: id,
      createdAt: new Date(),
      ...review,
    })
    return Promise.resolve(true)
  }

  listReviews(id: string) {
    return Promise.resolve(
      this.reviews.filter((review) => review.packageId === id),
    )
  }

  private claim(id: string, edit: PackageEdit): ExamPackageDetail | null {
    const row = this.packages.get(id)
    if (!row || row.deletedAt !== null || row.status !== edit.expected) {
      return null
    }
    return row
  }

  private store(row: ExamPackageDetail, edit: PackageEdit, items = row.items) {
    const updated = {
      ...row,
      status: edit.next,
      items,
      updatedAt: new Date(),
    }
    this.packages.set(row.id, updated)
    return updated
  }

  private bank(): FakeQuestionRepository {
    if (!this.questions) throw new Error('Pass a FakeQuestionRepository')
    return this.questions
  }

  addQuestion(id: string, edit: PackageEdit, question: NewQuestionInput) {
    return this.addQuestions(id, edit, [question])
  }

  async addQuestions(
    id: string,
    edit: PackageEdit,
    questions: NewQuestionInput[],
  ) {
    const row = this.claim(id, edit)
    if (!row) return null
    const items = [...row.items]
    for (const question of questions) {
      const created = await this.bank().create(question)
      items.push({
        questionId: created.id,
        questionVersion: 1,
        position: items.length + 1,
      })
    }
    return this.store(row, edit, items)
  }

  async changeQuestion(
    id: string,
    edit: PackageEdit,
    questionId: string,
    fields: VersionFields,
    createdById: string,
  ) {
    const row = this.claim(id, edit)
    const existing = this.bank().questions.get(questionId)
    if (!row || !existing) return null
    const changed = await this.bank().addVersion(
      questionId,
      fields,
      createdById,
    )
    if (!changed) return null
    return this.store(
      row,
      edit,
      row.items.map((item) =>
        item.questionId === questionId
          ? { ...item, questionVersion: changed.currentVersion }
          : item,
      ),
    )
  }

  removeQuestion(id: string, edit: PackageEdit, questionId: string) {
    const row = this.claim(id, edit)
    const existing = this.bank().questions.get(questionId)
    if (!row || !existing) return Promise.resolve(null)
    this.bank().questions.set(questionId, {
      ...existing,
      deletedAt: new Date(),
    })
    const items = row.items
      .filter((item) => item.questionId !== questionId)
      .map((item, index) => ({ ...item, position: index + 1 }))
    return Promise.resolve(this.store(row, edit, items))
  }

  reorderQuestions(id: string, edit: PackageEdit, questionIds: string[]) {
    const row = this.claim(id, edit)
    if (!row) return Promise.resolve(null)
    const byId = new Map(row.items.map((item) => [item.questionId, item]))
    const items = questionIds.map((questionId, index) => ({
      ...(byId.get(questionId) as ExamPackageDetail['items'][number]),
      position: index + 1,
    }))
    return Promise.resolve(this.store(row, edit, items))
  }
}
