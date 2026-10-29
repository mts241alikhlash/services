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
    now: Date,
    limit: number,
    excludeSessionIds: string[],
  ): Promise<PublicationCandidate[]> {
    return this.prisma.$queryRaw<PublicationCandidate[]>`
      SELECT session_id AS "sessionId", attempts, last_attempt_at AS "lastAttemptAt"
      FROM score_publications
      WHERE status = 'PENDING'
        AND permanent_failures < ${MAX_PERMANENT_FAILURES}
        AND session_id <> ALL(${excludeSessionIds}::uuid[])
        AND (
          last_attempt_at IS NULL
          OR last_attempt_at <= ${now}::timestamp
            - LEAST(power(2, attempts), 60) * interval '1 minute'
        )
      ORDER BY last_attempt_at ASC NULLS FIRST, id ASC
      LIMIT ${limit}
    `
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
