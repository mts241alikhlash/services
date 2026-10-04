import { Injectable } from '@nestjs/common'
import { IAttendanceRepository } from '../../../domain/repositories/attendance.repository.js'
import type { GetAttendancesInput } from './get-attendances.input.js'

@Injectable()
export class GetAttendancesUseCase {
  constructor(private readonly attendanceRepository: IAttendanceRepository) {}
  async execute(input: GetAttendancesInput, scope?: { studentId: string }) {
    return this.attendanceRepository.findAll({
      page: input.page,
      limit: input.limit,
      status: input.status,
      enrollmentId: input.enrollmentId,
      scheduleId: input.scheduleId,
      classroomId: input.classroomId,
      semesterId: input.semesterId,
      date: input.date,
      ...(scope && { studentId: scope.studentId }),
    })
  }
}
