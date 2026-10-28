import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { IScheduleSessionGuard } from '../../../domain/ports/schedule-session-guard.port.js'

@Injectable()
export class PrismaScheduleSessionGuard extends IScheduleSessionGuard {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async idsWithSessions(scheduleIds: string[]): Promise<Set<string>> {
    if (scheduleIds.length === 0) return new Set()
    const rows = await this.prisma.examSession.groupBy({
      by: ['scheduleId'],
      where: { scheduleId: { in: scheduleIds } },
    })
    return new Set(rows.map((row) => row.scheduleId))
  }

  async hasSessions(scheduleId: string): Promise<boolean> {
    const count = await this.prisma.examSession.count({
      where: { scheduleId },
      take: 1,
    })
    return count > 0
  }
}
