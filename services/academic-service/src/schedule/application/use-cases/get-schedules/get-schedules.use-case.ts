import { Injectable } from '@nestjs/common'
import { IScheduleRepository } from '../../../domain/repositories/schedule.repository.js'
import type { GetSchedulesInput } from './get-schedules.input.js'

@Injectable()
export class GetSchedulesUseCase {
  constructor(private readonly scheduleRepository: IScheduleRepository) {}

  async execute(query: GetSchedulesInput) {
    return this.scheduleRepository.findAll({
      page: query.page,
      limit: query.limit,
      teachingAssignmentId: query.teachingAssignmentId,
      timeSlotId: query.timeSlotId,
      day: query.day,
    })
  }
}
