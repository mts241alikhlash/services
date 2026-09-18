import { Injectable } from '@nestjs/common'
import { ICredentialRepository } from '../../credential/domain/interfaces/credential-repository.interface.js'
import {
  IWorkPatternRepository,
  ResolvedPattern,
} from '../../work-pattern/domain/interfaces/work-pattern-repository.interface.js'
import { PresenceDayStatusEnum } from '../domain/entities/daily-presence.entity.js'

export interface ArrivalVerdict {
  status: PresenceDayStatusEnum
  lateMinutes: number
  workPatternId: string | null
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesOfDay(at: Date): number {
  return at.getUTCHours() * 60 + at.getUTCMinutes()
}

@Injectable()
export class DayStatusService {
  constructor(
    private readonly workPatterns: IWorkPatternRepository,
    private readonly credentials: ICredentialRepository,
  ) {}

  async expectation(
    userId: string,
    date: Date,
  ): Promise<{ expected: boolean; pattern: ResolvedPattern }> {
    const pattern = await this.workPatterns.resolveForUserAndDate(userId, date)

    if (!pattern.isWorkingDay) return { expected: false, pattern }
    if (await this.workPatterns.isNonWorkingDay(date)) {
      return { expected: false, pattern }
    }
    if (!(await this.credentials.wasValidOnDate(userId, date))) {
      return { expected: false, pattern }
    }

    return { expected: true, pattern }
  }

  async judgeArrival(
    userId: string,
    date: Date,
    arrivedAt: Date,
  ): Promise<ArrivalVerdict> {
    const { expected, pattern } = await this.expectation(userId, date)

    if (!expected || !pattern.startTime) {
      return {
        status: 'NOT_EXPECTED',
        lateMinutes: 0,
        workPatternId: pattern.workPatternId,
      }
    }

    const lateBy =
      minutesOfDay(arrivedAt) -
      toMinutes(pattern.startTime) -
      pattern.graceMinutes

    return {
      status: lateBy > 0 ? 'LATE' : 'PRESENT',
      lateMinutes: Math.max(0, lateBy),
      workPatternId: pattern.workPatternId,
    }
  }

  async judgeDeparture(
    userId: string,
    date: Date,
    leftAt: Date,
  ): Promise<number> {
    const { expected, pattern } = await this.expectation(userId, date)

    if (!expected || !pattern.endTime) return 0

    return Math.max(0, toMinutes(pattern.endTime) - minutesOfDay(leftAt))
  }
}
