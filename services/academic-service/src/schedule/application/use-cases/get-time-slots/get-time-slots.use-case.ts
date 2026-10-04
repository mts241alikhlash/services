import { Injectable } from '@nestjs/common'
import { ITimeSlotRepository } from '../../../domain/repositories/time-slot.repository.js'

@Injectable()
export class GetTimeSlotsUseCase {
  constructor(private readonly timeSlotRepository: ITimeSlotRepository) {}

  async execute() {
    return this.timeSlotRepository.findAll()
  }
}
