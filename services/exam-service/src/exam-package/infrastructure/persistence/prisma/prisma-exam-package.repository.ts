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
} from '../../../domain/entities/exam-package.entity.js'
import {
  IExamPackageRepository,
  type DraftFields,
  type ExamPackageListQuery,
  type NewExamPackage,
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
  }
}

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

  async replaceDraftItems(
    id: string,
    fields: DraftFields,
  ): Promise<ExamPackageDetail | null> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.examPackage.updateMany({
        where: { id, status: 'DRAFT', deletedAt: null },
        data: { title: fields.title },
      })
      if (updated.count === 0) return null

      await tx.examPackageItem.deleteMany({ where: { packageId: id } })
      await tx.examPackageItem.createMany({
        data: fields.items.map((item) => ({ ...item, packageId: id })),
      })
      const row = await tx.examPackage.findFirstOrThrow({
        where: { id },
        include: DETAIL_INCLUDE,
      })
      return toDetail(row)
    })
  }

  async softDeleteDraft(id: string): Promise<boolean> {
    const result = await this.prisma.examPackage.updateMany({
      where: { id, status: 'DRAFT', deletedAt: null },
      data: { deletedAt: new Date() },
    })
    return result.count > 0
  }

  async setStatusIf(
    id: string,
    from: ExamPackageStatus[],
    to: ExamPackageStatus,
  ): Promise<boolean> {
    const result = await this.prisma.examPackage.updateMany({
      where: { id, status: { in: from }, deletedAt: null },
      data: { status: to },
    })
    return result.count > 0
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

  async addQuestion(
    id: string,
    edit: PackageEdit,
    question: NewQuestionInput,
  ): Promise<ExamPackageDetail | null> {
    return this.prisma.$transaction(async (tx) => {
      if (!(await this.claim(tx, id, edit))) return null
      const position =
        (await tx.examPackageItem.count({ where: { packageId: id } })) + 1
      const created = await tx.question.create({
        data: {
          packageId: id,
          subjectId: question.subjectId,
          gradeId: question.gradeId,
          authorEmployeeId: question.authorEmployeeId,
          type: question.type,
          createdById: question.createdById,
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
      await tx.examPackageItem.create({
        data: {
          packageId: id,
          questionId: created.id,
          questionVersion: 1,
          position,
        },
      })
      return this.detail(tx, id)
    })
  }

  async changeQuestion(
    id: string,
    edit: PackageEdit,
    questionId: string,
    fields: VersionFields,
    createdById: string,
  ): Promise<ExamPackageDetail | null> {
    return this.prisma.$transaction(async (tx) => {
      const question = await tx.question.findFirst({
        where: { id: questionId, packageId: id, deletedAt: null },
      })
      if (question === null || !(await this.claim(tx, id, edit))) return null
      const number = question.currentVersion + 1
      await tx.questionVersion.create({
        data: {
          questionId,
          number,
          bodyHtml: fields.bodyHtml,
          content: fields.content as unknown as Prisma.InputJsonValue,
          points: fields.points,
          createdById,
        },
      })
      await tx.question.update({
        where: { id: questionId },
        data: { currentVersion: number, revision: { increment: 1 } },
      })
      await tx.examPackageItem.updateMany({
        where: { packageId: id, questionId },
        data: { questionVersion: number },
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
    return this.prisma.$transaction(async (tx) => {
      if (!(await this.claim(tx, id, edit))) return null
      await tx.examPackageItem.updateMany({
        where: { packageId: id },
        data: { position: { increment: 1_000_000 } },
      })
      for (const [index, questionId] of questionIds.entries()) {
        await tx.examPackageItem.updateMany({
          where: { packageId: id, questionId },
          data: { position: index + 1 },
        })
      }
      return this.detail(tx, id)
    })
  }
}
