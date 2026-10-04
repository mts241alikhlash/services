import { Injectable, NotFoundException } from '@nestjs/common'
import { ISemesterRepository } from '../../../../semester/index.js'
import { IAcademicCalendarRepository } from '../../../domain/repositories/academic-calendar.repository.js'
import { resolveCalendarHours } from '../../../domain/policies/resolve-calendar-hours.policy.js'
import { AssertClassroomsExistService } from '../../services/assert-classrooms-exist.service.js'
import type { UpdateAcademicCalendarInput } from './update-academic-calendar.input.js'

@Injectable()
export class UpdateAcademicCalendarUseCase {
  constructor(
    private readonly academicCalendarRepository: IAcademicCalendarRepository,
    private readonly semesterRepository: ISemesterRepository,
    private readonly assertClassroomsExist: AssertClassroomsExistService,
  ) {}

  async execute(id: string, input: UpdateAcademicCalendarInput) {
    const calendar = await this.academicCalendarRepository.findById(id)
    if (!calendar) {
      throw new NotFoundException(`Academic calendar with id ${id} not found`)
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

    const { startDate, endDate, startTime, endTime, ...rest } = input
    return this.academicCalendarRepository.update(id, {
      ...rest,
      ...(startTime !== undefined || endTime !== undefined
        ? resolveCalendarHours(startTime, endTime)
        : {}),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: new Date(endDate) }),
    })
  }
}
