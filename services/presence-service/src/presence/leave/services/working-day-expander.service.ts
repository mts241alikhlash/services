import { Injectable } from '@nestjs/common'
import { IWorkPatternRepository } from '../../work-pattern/domain/interfaces/work-pattern-repository.interface.js'

@Injectable()
export class WorkingDayExpanderService {
  constructor(private readonly workPatterns: IWorkPatternRepository) {}

  async expand(userId: string, start: Date, end: Date): Promise<Date[]> {
    const days: Date[] = []

    for (
      const cursor = new Date(start);
      cursor <= end;
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    ) {
      const date = new Date(cursor)
      const pattern = await this.workPatterns.resolveForUserAndDate(
        userId,
        date,
      )

      if (!pattern.isWorkingDay) continue
      if (await this.workPatterns.isNonWorkingDay(date)) continue

      days.push(date)
    }

    return days
  }
}
