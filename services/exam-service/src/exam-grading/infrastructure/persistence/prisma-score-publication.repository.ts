import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma.service.js'
import {
  IScorePublicationRepository,
  type PublicationCandidate,
} from '../../domain/repositories/score-publication.repository.js'

const MAX_PERMANENT_FAILURES = 10

@Injectable()
export class PrismaScorePublicationRepository extends IScorePublicationRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findCandidates(
    limit: number,
    excludeSessionIds: string[],
  ): Promise<PublicationCandidate[]> {
    const rows = await this.prisma.scorePublication.findMany({
      where: {
        status: 'PENDING',
        permanentFailures: { lt: MAX_PERMANENT_FAILURES },
        sessionId: { notIn: excludeSessionIds },
      },
      orderBy: [
        { lastAttemptAt: { sort: 'asc', nulls: 'first' } },
        { id: 'asc' },
      ],
      take: limit,
      select: { sessionId: true, attempts: true, lastAttemptAt: true },
    })
    return rows
  }

  async markSent(
    sessionId: string,
    at: Date,
    gradedAt: Date | null,
  ): Promise<void> {
    await this.prisma.scorePublication.updateMany({
      where: { sessionId, session: { gradedAt } },
      data: { status: 'SENT', sentAt: at, lastAttemptAt: at, lastError: null },
    })
  }

  async markFailed(
    sessionId: string,
    at: Date,
    reason: string,
    permanent: boolean,
    gradedAt: Date | null,
  ): Promise<void> {
    await this.prisma.scorePublication.updateMany({
      where: { sessionId, session: { gradedAt } },
      data: {
        attempts: { increment: 1 },
        ...(permanent ? { permanentFailures: { increment: 1 } } : {}),
        lastAttemptAt: at,
        lastError: reason.slice(0, 300),
      },
    })
  }
}
