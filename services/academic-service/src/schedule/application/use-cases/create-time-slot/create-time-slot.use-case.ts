import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { ITimeSlotRepository } from '../../../domain/repositories/time-slot.repository.js'
import type { CreateTimeSlotInput } from './create-time-slot.input.js'

@Injectable()
export class CreateTimeSlotUseCase {
  private readonly logger = new Logger(CreateTimeSlotUseCase.name)

  constructor(private readonly timeSlotRepository: ITimeSlotRepository) {}

  async execute(input: CreateTimeSlotInput) {
    const conflict = await this.timeSlotRepository.findByOrder(input.order)
    if (conflict) {
      throw new ConflictException(
        `Time slot with order ${input.order} already exists`,
      )
    }

    const ts = await this.timeSlotRepository.create({
      name: input.name,
      startTime: input.startTime,
      endTime: input.endTime,
      order: input.order,
      typeId: input.typeId,
    })
    this.logger.log(`TimeSlot created: ${ts.name}`)
    return ts
  }
}
