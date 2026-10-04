import { Injectable } from '@nestjs/common'
import { ITimeSlotRepository } from '../../../domain/repositories/time-slot.repository.js'

@Injectable()
export class GetTimeSlotTypesUseCase {
  constructor(private readonly timeSlotRepository: ITimeSlotRepository) {}

  async execute() {
    return this.timeSlotRepository.findAllTypes()
  }
}
