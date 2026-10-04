import { Injectable, NotFoundException } from '@nestjs/common'
import { IAcademicCalendarRepository } from '../../../domain/repositories/academic-calendar.repository.js'

export interface BulkDeleteAcademicCalendarsResult {
  deleted: number
}

@Injectable()
export class BulkDeleteAcademicCalendarsUseCase {
  constructor(
    private readonly academicCalendarRepository: IAcademicCalendarRepository,
  ) {}

  async execute(ids: string[]): Promise<BulkDeleteAcademicCalendarsResult> {
    const unique = [...new Set(ids)]
    const deleted = await this.academicCalendarRepository.softDeleteMany(unique)

    if (deleted !== unique.length) {
      throw new NotFoundException(
        `${unique.length - deleted} of ${unique.length} academic calendar entries were not found`,
      )
    }

    return { deleted }
  }
}
