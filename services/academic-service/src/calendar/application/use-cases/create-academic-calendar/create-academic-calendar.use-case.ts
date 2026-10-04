import { Injectable, NotFoundException } from '@nestjs/common'
import { IAcademicYearRepository } from '../../../../academic-year/index.js'
import { ISemesterRepository } from '../../../../semester/index.js'
import { IAcademicCalendarRepository } from '../../../domain/repositories/academic-calendar.repository.js'
import { resolveCalendarHours } from '../../../domain/policies/resolve-calendar-hours.policy.js'
import { AssertClassroomsExistService } from '../../services/assert-classrooms-exist.service.js'
import type { CreateAcademicCalendarInput } from './create-academic-calendar.input.js'

@Injectable()
export class CreateAcademicCalendarUseCase {
  constructor(
    private readonly academicCalendarRepository: IAcademicCalendarRepository,
    private readonly academicYearRepository: IAcademicYearRepository,
    private readonly semesterRepository: ISemesterRepository,
    private readonly assertClassroomsExist: AssertClassroomsExistService,
  ) {}

  async execute(input: CreateAcademicCalendarInput) {
    const academicYear = await this.academicYearRepository.findById(
      input.academicYearId,
    )
    if (!academicYear) {
      throw new NotFoundException(
        `Academic year with id ${input.academicYearId} not found`,
      )
    }

    if (input.semesterId) {
      const semester = await this.semesterRepository.findById(input.semesterId)
      if (!semester) {
        throw new NotFoundException(
          `Semester with id ${input.semesterId} not found`,
        )
      }
    }

    await this.assertClassroomsExist.execute(input.classroomIds)

    return this.academicCalendarRepository.create({
      ...input,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      ...resolveCalendarHours(input.startTime, input.endTime),
    })
  }
}
