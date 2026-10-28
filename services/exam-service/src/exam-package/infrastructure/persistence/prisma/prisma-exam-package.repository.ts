import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import type { Prisma } from '../../../../generated/prisma/client.js'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import type {
  ExamPackageDetail,
  ExamPackageSummary,
} from '../../../domain/entities/exam-package.entity.js'
import {
  IExamPackageRepository,
  type DraftFields,
  type ExamPackageListQuery,
  type NewExamPackage,
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
}
