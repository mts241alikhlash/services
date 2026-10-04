import { BadRequestException, Injectable } from '@nestjs/common'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import { IAttendanceRepository } from '../../../domain/repositories/attendance.repository.js'
import type { BulkUpsertAttendanceInput } from './bulk-upsert-attendance.input.js'

@Injectable()
export class BulkUpsertAttendanceUseCase {
  constructor(
    private readonly attendanceRepository: IAttendanceRepository,
    private readonly enrollmentLookup: IEnrollmentLookupPort,
  ) {}
  async execute(input: BulkUpsertAttendanceInput) {
    const enrollmentIds = input.records.map((r) => r.enrollmentId)
    if (enrollmentIds.length > 0) {
      const count = await this.enrollmentLookup.countActive(enrollmentIds)
      if (count !== enrollmentIds.length) {
        throw new BadRequestException(
          'Some enrollments were not found or are not active',
        )
      }
    }
    return this.attendanceRepository.bulkUpsert(
      new Date(input.date),
      input.records,
      input.scheduleId,
    )
  }
}
