import { Injectable } from '@nestjs/common'
import { IAcademicCalendarRepository } from '../../../domain/repositories/academic-calendar.repository.js'
import type { GetAcademicCalendarsInput } from './get-academic-calendars.input.js'

@Injectable()
export class GetAcademicCalendarsUseCase {
  constructor(
    private readonly academicCalendarRepository: IAcademicCalendarRepository,
  ) {}

  async execute(input: GetAcademicCalendarsInput) {
    return this.academicCalendarRepository.findAll({
      page: input.page,
      limit: input.limit,
      academicYearId: input.academicYearId,
      semesterId: input.semesterId,
      typeId: input.typeId,
    })
  }
}
