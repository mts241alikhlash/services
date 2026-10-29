import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import {
  IQuestionRepository,
  type PinnedQuestion,
  type QuestionPin,
} from '../../../domain/repositories/question.repository.js'
import type { QuestionContent } from '../../../domain/value-objects/question-content.js'
import { QUESTION_INCLUDE, toDetail } from './prisma-question.mapper.js'

@Injectable()
export class PrismaQuestionRepository extends IQuestionRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
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
      include: {
        question: {
          select: {
            type: true,
            copiedFromQuestionId: true,
            currentVersion: true,
          },
        },
      },
    })
    return rows.map((row) => ({
      questionId: row.questionId,
      copiedFromQuestionId: row.question.copiedFromQuestionId,
      currentVersion: row.question.currentVersion,
      number: row.number,
      type: row.question.type,
      bodyHtml: row.bodyHtml,
      content: row.content as unknown as QuestionContent,
      points: row.points,
    }))
  }

  async findById(id: string) {
    const row = await this.prisma.question.findFirst({
      where: { id, deletedAt: null },
      include: QUESTION_INCLUDE,
    })
    return row ? toDetail(row) : null
  }
}
