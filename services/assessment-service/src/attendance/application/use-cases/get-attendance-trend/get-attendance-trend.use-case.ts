import { Injectable } from '@nestjs/common'
import { IAttendanceRepository } from '../../../domain/repositories/attendance.repository.js'
import type { GetAttendanceTrendInput } from './get-attendance-trend.input.js'

@Injectable()
export class GetAttendanceTrendUseCase {
  constructor(private readonly attendanceRepository: IAttendanceRepository) {}
  async execute(input: GetAttendanceTrendInput) {
    return this.attendanceRepository.getMonthlyTrend({
      classroomId: input.classroomId,
      semesterId: input.semesterId,
    })
  }
}
