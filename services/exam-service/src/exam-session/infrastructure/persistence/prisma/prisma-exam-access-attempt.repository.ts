import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import {
  LOCK_MINUTES,
  MAX_FAILURES,
  type AttemptState,
} from '../../../domain/policies/access-attempt.policy.js'
import { IExamAccessAttemptRepository } from '../../../domain/repositories/exam-access-attempt.repository.js'

@Injectable()
export class PrismaExamAccessAttemptRepository extends IExamAccessAttemptRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async get(scheduleId: string, studentId: string): Promise<AttemptState> {
    const row = await this.prisma.examAccessAttempt.findUnique({
      where: { scheduleId_studentId: { scheduleId, studentId } },
    })
    return row
      ? { failures: row.failures, lockedUntil: row.lockedUntil }
      : { failures: 0, lockedUntil: null }
  }

  async registerFailure(
    scheduleId: string,
    studentId: string,
    now: Date,
  ): Promise<void> {
    const row = await this.prisma.examAccessAttempt.upsert({
      where: { scheduleId_studentId: { scheduleId, studentId } },
      create: { scheduleId, studentId, failures: 1 },
      update: { failures: { increment: 1 } },
    })
    if (row.failures >= MAX_FAILURES) {
      await this.prisma.examAccessAttempt.updateMany({
        where: { scheduleId, studentId, failures: { gte: MAX_FAILURES } },
        data: {
          failures: 0,
          lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000),
        },
      })
    }
  }

  async clear(scheduleId: string, studentId: string): Promise<void> {
    await this.prisma.examAccessAttempt.deleteMany({
      where: { scheduleId, studentId },
    })
  }
}
