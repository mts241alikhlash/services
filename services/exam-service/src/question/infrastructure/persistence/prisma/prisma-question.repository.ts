import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import type { Prisma } from '../../../../generated/prisma/client.js'
import type { TeachingPair } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import type {
  ApprovedQuestionRef,
  QuestionVersion,
} from '../../../domain/entities/question.entity.js'
import {
  IQuestionRepository,
  type ExpectedState,
  type NewQuestionInput,
  type PinnedQuestion,
  type QuestionListQuery,
  type QuestionPin,
  type QuestionSummary,
  type ReviewInput,
  type VersionFields,
} from '../../../domain/repositories/question.repository.js'
import type {
  QuestionContent,
  QuestionStatus,
} from '../../../domain/value-objects/question-content.js'
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

  async findApprovedRefs(ids: string[]): Promise<ApprovedQuestionRef[]> {
    if (ids.length === 0) return []
    return this.prisma.question.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        subjectId: true,
        gradeId: true,
        status: true,
        approvedVersion: true,
        deletedAt: true,
      },
    })
  }

  async findPinned(pins: QuestionPin[]): Promise<PinnedQuestion[]> {
    if (pins.length === 0) return []
    const rows = await this.prisma.questionVersion.findMany({
      where: {
        OR: pins.map((pin) => ({
          questionId: pin.questionId,
          number: pin.number,
        })),
      },
      include: { question: { select: { type: true } } },
    })
    return rows.map((row) => ({
      questionId: row.questionId,
      number: row.number,
      type: row.question.type,
      bodyHtml: row.bodyHtml,
      content: row.content as unknown as QuestionContent,
      points: row.points,
    }))
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

  async findAuthorIds(
    pairs: TeachingPair[] | null,
    status?: QuestionStatus,
  ): Promise<string[]> {
    if (pairs !== null && pairs.length === 0) return []

    const rows = await this.prisma.question.findMany({
      where: buildQuestionWhere({ page: 1, limit: 1, pairs, status }),
      select: { authorEmployeeId: true },
      distinct: ['authorEmployeeId'],
    })
    return rows.map((row) => row.authorEmployeeId)
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
    expected: ExpectedState,
  ) {
    const row = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.question.updateMany({
        where: {
          id,
          deletedAt: null,
          status: expected.status,
          currentVersion: expected.currentVersion,
        },
        data: { status, revision: { increment: 1 } },
      })
      if (claimed.count === 0) return null

      await tx.questionVersion.update({
        where: {
          questionId_number: {
            questionId: id,
            number: expected.currentVersion,
          },
        },
        data: {
          bodyHtml: fields.bodyHtml,
          content: fields.content as unknown as Prisma.InputJsonValue,
          points: fields.points,
        },
      })
      return tx.question.findUniqueOrThrow({
        where: { id },
        include: QUESTION_INCLUDE,
      })
    })
    return row ? toDetail(row) : null
  }

  async addVersion(
    id: string,
    fields: VersionFields,
    createdById: string,
    expected: ExpectedState,
  ) {
    const number = expected.currentVersion + 1
    const row = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.question.updateMany({
        where: {
          id,
          deletedAt: null,
          status: expected.status,
          currentVersion: expected.currentVersion,
        },
        data: {
          currentVersion: number,
          status: 'DRAFT',
          revision: { increment: 1 },
        },
      })
      if (claimed.count === 0) return null

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
      return tx.question.findUniqueOrThrow({
        where: { id },
        include: QUESTION_INCLUDE,
      })
    })
    return row ? toDetail(row) : null
  }

  async applyReview(id: string, input: ReviewInput) {
    const row = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.question.updateMany({
        where: {
          id,
          deletedAt: null,
          status: { in: input.from },
          currentVersion: input.expectedVersion,
          ...(input.expectedRevision !== undefined && {
            revision: input.expectedRevision,
          }),
        },
        data: {
          status: input.to,
          ...(input.action === 'APPROVED' && {
            approvedVersion: input.expectedVersion,
          }),
        },
      })
      if (claimed.count === 0) return null

      await tx.questionReview.create({
        data: {
          questionId: id,
          versionNumber: input.expectedVersion,
          action: input.action,
          note: input.note,
          byUserId: input.byUserId,
        },
      })
      return tx.question.findUniqueOrThrow({
        where: { id },
        include: QUESTION_INCLUDE,
      })
    })
    return row ? toDetail(row) : null
  }

  async softDeleteNeverApproved(id: string): Promise<boolean> {
    const result = await this.prisma.question.updateMany({
      where: { id, deletedAt: null, approvedVersion: null },
      data: { deletedAt: new Date() },
    })
    return result.count > 0
  }
}
