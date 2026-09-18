import { ConflictException, Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma.service.js'
import { IProfileLookupPort } from '../../../platform/profile-lookup/profile-lookup.port.js'
import { AttendancePeriodEntity } from '../domain/entities/attendance-period.entity.js'
import { IAttendancePeriodRepository } from '../domain/interfaces/attendance-period-repository.interface.js'

const MAX_LISTED = 10

export interface IncompleteRecord {
  userId: string
  displayName: string | null
  date: string
}

@Injectable()
export class CloseAttendancePeriodUseCase {
  constructor(
    private readonly periods: IAttendancePeriodRepository,
    private readonly prisma: PrismaService,
    private readonly profileLookupPort: IProfileLookupPort,
  ) {}

  async execute(
    year: number,
    month: number,
    closedBy: string,
  ): Promise<AttendancePeriodEntity> {
    const existing = await this.periods.findByPeriod(year, month)
    if (existing?.status === 'CLOSED') {
      throw new ConflictException('This period is already closed.')
    }

    const incomplete = await this.findIncomplete(year, month)
    if (incomplete.length > 0) {
      throw new ConflictException({
        message: `${incomplete.length} record(s) have no check-out and must be resolved before closing.`,
        incomplete: incomplete.slice(0, MAX_LISTED),
        total: incomplete.length,
      })
    }

    return this.periods.close({
      year,
      month,
      closedBy,
      closedAt: new Date(),
    })
  }

  private async findIncomplete(
    year: number,
    month: number,
  ): Promise<IncompleteRecord[]> {
    const from = new Date(Date.UTC(year, month - 1, 1))
    const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))

    const rows = await this.prisma.dailyPresence.findMany({
      where: {
        date: { gte: from, lte: to },
        deletedAt: null,
        checkInAt: { not: null },
        checkOutAt: null,
        status: { in: ['PRESENT', 'LATE'] },
      },
      select: { userId: true, date: true },
      orderBy: { date: 'asc' },
    })

    const profiles = await this.profileLookupPort.findByUserIds(
      rows.map((row) => row.userId),
    )
    const nameByUserId = new Map(profiles.map((p) => [p.userId, p.name]))

    return rows.map((row) => ({
      userId: row.userId,
      displayName: nameByUserId.get(row.userId) ?? null,
      date: row.date.toISOString().slice(0, 10),
    }))
  }
}
