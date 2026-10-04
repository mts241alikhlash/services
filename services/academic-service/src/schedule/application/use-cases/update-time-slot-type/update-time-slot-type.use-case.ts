import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ITimeSlotRepository } from '../../../domain/repositories/time-slot.repository.js'
import type { UpdateTimeSlotTypeInput } from './update-time-slot-type.input.js'

@Injectable()
export class UpdateTimeSlotTypeUseCase {
  constructor(private readonly timeSlotRepository: ITimeSlotRepository) {}

  async execute(id: string, input: UpdateTimeSlotTypeInput) {
    const type = await this.timeSlotRepository.findTypeById(id)
    if (!type) {
      throw new NotFoundException('Time slot type not found')
    }
    if (input.code) {
      const dup = await this.timeSlotRepository.findTypeByCode(input.code)
      if (dup && dup.id !== id) {
        throw new ConflictException(
          `Time slot type code "${input.code}" is already in use`,
        )
      }
    }
    return this.timeSlotRepository.updateType(id, {
      code: input.code,
      name: input.name,
      isLesson: input.isLesson,
      days: input.days,
      defaultDurationMinutes: input.defaultDurationMinutes,
    })
  }
}
