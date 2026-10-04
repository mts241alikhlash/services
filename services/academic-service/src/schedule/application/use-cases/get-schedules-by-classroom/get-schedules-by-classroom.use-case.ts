import { Injectable } from '@nestjs/common'
import { IScheduleRepository } from '../../../domain/repositories/schedule.repository.js'

@Injectable()
export class GetSchedulesByClassroomUseCase {
  constructor(private readonly scheduleRepository: IScheduleRepository) {}

  async execute(classroomId: string) {
    return this.scheduleRepository.findByClassroom(classroomId)
  }
}
