import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import { IAttendanceRepository } from '../../../domain/repositories/attendance.repository.js'
import type { CreateAttendanceInput } from './create-attendance.input.js'

@Injectable()
export class CreateAttendanceUseCase {
  constructor(
    private readonly attendanceRepository: IAttendanceRepository,
    private readonly enrollmentLookup: IEnrollmentLookupPort,
  ) {}
  async execute(input: CreateAttendanceInput) {
    const enrollment = await this.enrollmentLookup.findSummary(
      input.enrollmentId,
    )
    if (enrollment?.status !== 'ACTIVE') {
      throw new BadRequestException('Enrollment not found or is not active')
    }

    const dup = await this.attendanceRepository.findDuplicate(
      input.enrollmentId,
      new Date(input.date),
      input.scheduleId,
    )
    if (dup)
      throw new ConflictException('Attendance already recorded for this date')

    const softDeleted = await this.attendanceRepository.findSoftDeleted(
      input.enrollmentId,
      new Date(input.date),
      input.scheduleId,
    )
    if (softDeleted) {
      return this.attendanceRepository.restore(softDeleted.id, {
        status: input.status,
        note: input.note,
      })
    }

    return this.attendanceRepository.create({
      ...input,
      date: new Date(input.date),
    })
  }
}
