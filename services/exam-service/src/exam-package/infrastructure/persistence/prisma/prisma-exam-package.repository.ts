import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import type { Prisma } from '../../../../generated/prisma/client.js'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import type {
  NewQuestionInput,
  VersionFields,
} from '../../../../question/domain/repositories/question.repository.js'
import type {
  ExamPackageDetail,
  ExamPackageStatus,
  ExamPackageSummary,
  PackageQuestionNote,
  PackageReview,
} from '../../../domain/entities/exam-package.entity.js'
import {
  IExamPackageRepository,
  type ExamPackageListQuery,
  type NewExamPackage,
  type NewPackageReview,
  type PackageEdit,
} from '../../../domain/repositories/exam-package.repository.js'
import {
  DETAIL_INCLUDE,
  SUMMARY_INCLUDE,
  toDetail,
  toSummary,
} from './prisma-exam-package.mapper.js'

function buildWhere(query: ExamPackageListQuery): Prisma.ExamPackageWhereInput {
  return {
    deletedAt: null,
    ...(query.subjectId ? { subjectId: query.subjectId } : {}),
    ...(query.gradeId ? { gradeId: query.gradeId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? { title: { contains: query.search, mode: 'insensitive' } }
      : {}),
    ...(query.visibleTo
      ? {
          OR: [
            { createdById: query.visibleTo },
            { status: { in: ['APPROVED', 'LOCKED'] } },
          ],
        }
      : {}),
  }
}

class AbortChange extends Error {}

@Injectable()
export class PrismaExamPackageRepository extends IExamPackageRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findAll(
    query: ExamPackageListQuery,
  ): Promise<PaginatedResult<ExamPackageSummary>> {
    const { page, limit } = query
    const where = buildWhere(query)
    const [rows, total] = await Promise.all([
      this.prisma.examPackage.findMany({
        where,
        include: SUMMARY_INCLUDE,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.examPackage.count({ where }),
    ])
    return { data: rows.map(toSummary), total, page, limit }
  }

  async findById(id: string): Promise<ExamPackageDetail | null> {
    const row = await this.prisma.examPackage.findFirst({
      where: { id, deletedAt: null },
      include: DETAIL_INCLUDE,
    })
    return row ? toDetail(row) : null
  }

  async create(input: NewExamPackage): Promise<ExamPackageDetail> {
    const row = await this.prisma.examPackage.create({
      data: {
        title: input.title,
        subjectId: input.subjectId,
        gradeId: input.gradeId,
        createdById: input.createdById,
        items: { create: input.items },
      },
      include: DETAIL_INCLUDE,
    })
    return toDetail(row)
  }

  async softDeleteUnscheduled(id: string): Promise<boolean> {
    const result = await this.prisma.examPackage.updateMany({
      where: {
        id,
        status: { in: ['DRAFT', 'RETURNED', 'APPROVED'] },
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    })
    return result.count > 0
  }

  async renamePackage(
    id: string,
    edit: PackageEdit,
    title: string,
  ): Promise<ExamPackageDetail | null> {
    return this.prisma.$transaction(async (tx) => {
      if (!(await this.claim(tx, id, edit))) return null
      await tx.examPackage.update({ where: { id }, data: { title } })
      return this.detail(tx, id)
    })
  }

  async transition(
    id: string,
    from: ExamPackageStatus[],
    to: ExamPackageStatus,
    review: NewPackageReview,
  ): Promise<boolean> {
    const moved = await this.inTransaction(async (tx) => {
      const result = await tx.examPackage.updateMany({
        where: { id, status: { in: from }, deletedAt: null },
        data: { status: to },
      })
      if (result.count === 0) return false
      if (
        review.action === 'SUBMIT' &&
        (await tx.examPackageItem.count({ where: { packageId: id } })) === 0
      ) {
        throw new AbortChange()
      }
      await tx.examPackageReview.create({
        data: {
          packageId: id,
          action: review.action,
          byUserId: review.byUserId,
          note: review.note,
          questionNotes:
            review.questionNotes as unknown as Prisma.InputJsonValue,
        },
      })
      return true
    })
    return moved === true
  }

  async listReviews(id: string): Promise<PackageReview[]> {
    const rows = await this.prisma.examPackageReview.findMany({
      where: { packageId: id },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map((row) => ({
      id: row.id,
      packageId: row.packageId,
      action: row.action,
      byUserId: row.byUserId,
      note: row.note,
      questionNotes: row.questionNotes as unknown as PackageQuestionNote[],
      createdAt: row.createdAt,
    }))
  }

  private async claim(
    tx: Prisma.TransactionClient,
    id: string,
    edit: PackageEdit,
  ): Promise<boolean> {
    const result = await tx.examPackage.updateMany({
      where: { id, status: edit.expected, deletedAt: null },
      data: { status: edit.next },
    })
    return result.count > 0
  }

  private async detail(
    tx: Prisma.TransactionClient,
    id: string,
  ): Promise<ExamPackageDetail> {
    const row = await tx.examPackage.findFirstOrThrow({
      where: { id },
      include: DETAIL_INCLUDE,
    })
    return toDetail(row)
  }

  addQuestion(
    id: string,
    edit: PackageEdit,
    question: NewQuestionInput,
  ): Promise<ExamPackageDetail | null> {
    return this.addQuestions(id, edit, [question])
  }

  async addQuestions(
    id: string,
    edit: PackageEdit,
    questions: NewQuestionInput[],
  ): Promise<ExamPackageDetail | null> {
    return this.prisma.$transaction(async (tx) => {
      if (!(await this.claim(tx, id, edit))) return null
      let position = await tx.examPackageItem.count({
        where: { packageId: id },
      })
      for (const question of questions) {
        const created = await tx.question.create({
          data: {
            packageId: id,
            subjectId: question.subjectId,
            gradeId: question.gradeId,
            authorEmployeeId: question.authorEmployeeId,
            type: question.type,
            createdById: question.createdById,
            copiedFromQuestionId: question.copiedFromQuestionId ?? null,
            copiedFromVersion: question.copiedFromVersion ?? null,
            versions: {
              create: {
                number: 1,
                bodyHtml: question.bodyHtml,
                content: question.content as unknown as Prisma.InputJsonValue,
                points: question.points,
                createdById: question.createdById,
              },
            },
          },
        })
        position += 1
        await tx.examPackageItem.create({
          data: {
            packageId: id,
            questionId: created.id,
            questionVersion: 1,
            position,
          },
        })
      }
      return this.detail(tx, id)
    })
  }

  async changeQuestion(
    id: string,
    edit: PackageEdit,
    questionId: string,
    expectedRevision: number,
    fields: VersionFields,
    createdById: string,
  ): Promise<ExamPackageDetail | null> {
    return this.inTransaction(async (tx) => {
      const moved = await tx.question.updateMany({
        where: {
          id: questionId,
          packageId: id,
          deletedAt: null,
          revision: expectedRevision,
        },
        data: { currentVersion: { increment: 1 }, revision: { increment: 1 } },
      })
      if (moved.count === 0 || !(await this.claim(tx, id, edit))) {
        throw new AbortChange()
      }
      const question = await tx.question.findUniqueOrThrow({
        where: { id: questionId },
      })
      await tx.questionVersion.create({
        data: {
          questionId,
          number: question.currentVersion,
          bodyHtml: fields.bodyHtml,
          content: fields.content as unknown as Prisma.InputJsonValue,
          points: fields.points,
          createdById,
        },
      })
      await tx.examPackageItem.updateMany({
        where: { packageId: id, questionId },
        data: { questionVersion: question.currentVersion },
      })
      return this.detail(tx, id)
    })
  }

  async removeQuestion(
    id: string,
    edit: PackageEdit,
    questionId: string,
  ): Promise<ExamPackageDetail | null> {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.examPackageItem.findFirst({
        where: { packageId: id, questionId },
      })
      if (item === null || !(await this.claim(tx, id, edit))) return null
      await tx.examPackageItem.delete({ where: { id: item.id } })
      await tx.question.update({
        where: { id: questionId },
        data: { deletedAt: new Date() },
      })
      const later = await tx.examPackageItem.findMany({
        where: { packageId: id, position: { gt: item.position } },
        orderBy: { position: 'asc' },
      })
      for (const row of later) {
        await tx.examPackageItem.update({
          where: { id: row.id },
          data: { position: row.position - 1 },
        })
      }
      return this.detail(tx, id)
    })
  }

  async reorderQuestions(
    id: string,
    edit: PackageEdit,
    questionIds: string[],
  ): Promise<ExamPackageDetail | null> {
    return this.inTransaction(async (tx) => {
      if (!(await this.claim(tx, id, edit))) throw new AbortChange()
      const total = await tx.examPackageItem.count({ where: { packageId: id } })
      if (total !== questionIds.length) throw new AbortChange()
      await tx.examPackageItem.updateMany({
        where: { packageId: id },
        data: { position: { increment: 1_000_000 } },
      })
      let placed = 0
      for (const [index, questionId] of questionIds.entries()) {
        const result = await tx.examPackageItem.updateMany({
          where: { packageId: id, questionId, position: { gt: 1_000_000 } },
          data: { position: index + 1 },
        })
        placed += result.count
      }
      if (placed !== total) throw new AbortChange()
      return this.detail(tx, id)
    })
  }

  private async inTransaction<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T | null> {
    try {
      return await this.prisma.$transaction(work)
    } catch (error) {
      if (error instanceof AbortChange) return null
      throw error
    }
  }
}
