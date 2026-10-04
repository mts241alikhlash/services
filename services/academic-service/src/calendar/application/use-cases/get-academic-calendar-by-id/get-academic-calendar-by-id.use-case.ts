import { Injectable, NotFoundException } from '@nestjs/common'
import { IAcademicCalendarRepository } from '../../../domain/repositories/academic-calendar.repository.js'

@Injectable()
export class GetAcademicCalendarByIdUseCase {
  constructor(
    private readonly academicCalendarRepository: IAcademicCalendarRepository,
  ) {}

  async execute(id: string) {
    const calendar = await this.academicCalendarRepository.findById(id)
    if (!calendar) {
      throw new NotFoundException(`Academic calendar with id ${id} not found`)
    }
    return calendar
  }
}
