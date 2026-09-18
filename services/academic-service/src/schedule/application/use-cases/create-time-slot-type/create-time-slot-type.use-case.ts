import { ConflictException, Injectable } from '@nestjs/common'
import { ITimeSlotRepository } from '../../../domain/repositories/time-slot.repository.js'
import type { CreateTimeSlotTypeInput } from './create-time-slot-type.input.js'

@Injectable()
export class CreateTimeSlotTypeUseCase {
  constructor(private readonly timeSlotRepository: ITimeSlotRepository) {}

  async execute(input: CreateTimeSlotTypeInput) {
    const existing = await this.timeSlotRepository.findTypeByCode(input.code)
    if (existing) {
      throw new ConflictException(
        `Time slot type code "${input.code}" is already in use`,
      )
    }
    return this.timeSlotRepository.createType({
      code: input.code,
      name: input.name,
      isLesson: input.isLesson,
      days: input.days,
      defaultDurationMinutes: input.defaultDurationMinutes,
    })
  }
}
