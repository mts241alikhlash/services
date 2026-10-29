import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import type { Prisma } from '../../../../generated/prisma/client.js'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import type {
  ExamScore,
  ExamScoreInput,
} from '../../../domain/entities/exam-score.entity.js'
import {
  IExamScoreRepository,
  type ExamScoreQuery,
} from '../../../domain/repositories/exam-score.repository.js'

@Injectable()
export class PrismaExamScoreRepository extends IExamScoreRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async upsert(input: ExamScoreInput): Promise<ExamScore> {
    const { examSessionId, ...rest } = input
    return this.prisma.examScore.upsert({
      where: { examSessionId },
      create: input,
      update: rest,
    })
  }

  async findPage(query: ExamScoreQuery): Promise<PaginatedResult<ExamScore>> {
    if (query.pairs !== null && query.pairs.length === 0) {
      return { data: [], total: 0, page: query.page, limit: query.limit }
    }
    const where: Prisma.ExamScoreWhereInput = {
      ...(query.semesterId ? { semesterId: query.semesterId } : {}),
      ...(query.classroomId ? { classroomId: query.classroomId } : {}),
      ...(query.subjectId ? { subjectId: query.subjectId } : {}),
      ...(query.pairs === null ? {} : { OR: query.pairs }),
    }
    const [data, total] = await Promise.all([
      this.prisma.examScore.findMany({
        where,
        orderBy: [{ gradedAt: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.examScore.count({ where }),
    ])
    return { data, total, page: query.page, limit: query.limit }
  }
}
