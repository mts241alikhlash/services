import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import type { Prisma } from '../../../../generated/prisma/client.js'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import type { QuestionVersion } from '../../../domain/entities/question.entity.js'
import {
  IQuestionRepository,
  type NewQuestionInput,
  type QuestionListQuery,
  type QuestionSummary,
  type VersionFields,
} from '../../../domain/repositories/question.repository.js'
import type { QuestionStatus } from '../../../domain/value-objects/question-content.js'
import {
  QUESTION_INCLUDE,
  toDetail,
  toSummary,
  toVersion,
} from './prisma-question.mapper.js'
import { buildQuestionWhere } from './prisma-question.where.js'

@Injectable()
export class PrismaQuestionRepository extends IQuestionRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findAll(
    query: QuestionListQuery,
  ): Promise<PaginatedResult<QuestionSummary>> {
    const { page, limit } = query
    if (query.pairs !== null && query.pairs.length === 0) {
      return { data: [], total: 0, page, limit }
    }

    const where = buildQuestionWhere(query)
    const [rows, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        include: { versions: true },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.question.count({ where }),
    ])
    return { data: rows.map(toSummary), total, page, limit }
  }

  async findById(id: string) {
    const row = await this.prisma.question.findFirst({
      where: { id, deletedAt: null },
      include: QUESTION_INCLUDE,
    })
    return row ? toDetail(row) : null
  }

  async findVersions(questionId: string): Promise<QuestionVersion[]> {
    const rows = await this.prisma.questionVersion.findMany({
      where: { questionId },
      orderBy: { number: 'asc' },
    })
    return rows.map(toVersion)
  }

  async create(input: NewQuestionInput) {
    const row = await this.prisma.question.create({
      data: {
        subjectId: input.subjectId,
        gradeId: input.gradeId,
        authorEmployeeId: input.authorEmployeeId,
        type: input.type,
        createdById: input.createdById,
        versions: {
          create: {
            number: 1,
            bodyHtml: input.bodyHtml,
            content: input.content as unknown as Prisma.InputJsonValue,
            points: input.points,
            createdById: input.createdById,
          },
        },
      },
      include: QUESTION_INCLUDE,
    })
    return toDetail(row)
  }

  async editCurrentVersion(
    id: string,
    fields: VersionFields,
    status: QuestionStatus,
  ) {
    const row = await this.prisma.$transaction(async (tx) => {
      const { currentVersion } = await tx.question.findUniqueOrThrow({
        where: { id },
        select: { currentVersion: true },
      })
      await tx.questionVersion.update({
        where: {
          questionId_number: { questionId: id, number: currentVersion },
        },
        data: {
          bodyHtml: fields.bodyHtml,
          content: fields.content as unknown as Prisma.InputJsonValue,
          points: fields.points,
        },
      })
      return tx.question.update({
        where: { id },
        data: { status },
        include: QUESTION_INCLUDE,
      })
    })
    return toDetail(row)
  }

  async addVersion(id: string, fields: VersionFields, createdById: string) {
    const row = await this.prisma.$transaction(async (tx) => {
      const { currentVersion } = await tx.question.findUniqueOrThrow({
        where: { id },
        select: { currentVersion: true },
      })
      const number = currentVersion + 1
      await tx.questionVersion.create({
        data: {
          questionId: id,
          number,
          bodyHtml: fields.bodyHtml,
          content: fields.content as unknown as Prisma.InputJsonValue,
          points: fields.points,
          createdById,
        },
      })
      return tx.question.update({
        where: { id },
        data: { currentVersion: number, status: 'DRAFT' },
        include: QUESTION_INCLUDE,
      })
    })
    return toDetail(row)
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.question.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}
