import { Injectable } from '@nestjs/common'
import { IAttendanceRepository } from '../../../domain/repositories/attendance.repository.js'
import type { GetAttendanceRecapInput } from './get-attendance-recap.input.js'

@Injectable()
export class GetAttendanceRecapUseCase {
  constructor(private readonly attendanceRepository: IAttendanceRepository) {}
  async execute(input: GetAttendanceRecapInput) {
    return this.attendanceRepository.getRecap({
      classroomId: input.classroomId,
      semesterId: input.semesterId,
      month: input.month,
      year: input.year,
    })
  }
}
