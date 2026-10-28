import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { IScheduleSessionGuard } from '../../../domain/ports/schedule-session-guard.port.js'

@Injectable()
export class PrismaScheduleSessionGuard extends IScheduleSessionGuard {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async hasSessions(scheduleId: string): Promise<boolean> {
    const count = await this.prisma.examSession.count({
      where: { scheduleId },
      take: 1,
    })
    return count > 0
  }
}
