import { randomUUID } from 'node:crypto'
import type {
  ExamPackageDetail,
  ExamPackageSummary,
} from '../domain/entities/exam-package.entity.js'
import {
  IExamPackageRepository,
  type DraftFields,
  type ExamPackageListQuery,
  type NewExamPackage,
} from '../domain/repositories/exam-package.repository.js'

export class FakeExamPackageRepository extends IExamPackageRepository {
  readonly packages = new Map<string, ExamPackageDetail>()

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
}
