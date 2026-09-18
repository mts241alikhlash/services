import { Injectable, NotFoundException } from '@nestjs/common'
import { IAttendanceRepository } from '../../../domain/repositories/attendance.repository.js'
import type { UpdateAttendanceInput } from './update-attendance.input.js'

@Injectable()
export class UpdateAttendanceUseCase {
  constructor(private readonly attendanceRepository: IAttendanceRepository) {}
  async execute(id: string, input: UpdateAttendanceInput) {
    const r = await this.attendanceRepository.findById(id)
    if (!r) throw new NotFoundException(`Attendance ${id} not found`)
    return this.attendanceRepository.update(id, {
      status: input.status,
      note: input.note,
    })
  }
}
