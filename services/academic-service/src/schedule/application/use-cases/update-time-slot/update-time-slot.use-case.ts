import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { ITimeSlotRepository } from '../../../domain/repositories/time-slot.repository.js'
import type { UpdateTimeSlotInput } from './update-time-slot.input.js'

@Injectable()
export class UpdateTimeSlotUseCase {
  private readonly logger = new Logger(UpdateTimeSlotUseCase.name)

  constructor(private readonly timeSlotRepository: ITimeSlotRepository) {}

  async execute(id: string, input: UpdateTimeSlotInput) {
    const existing = await this.timeSlotRepository.findById(id)
    if (!existing) {
      throw new NotFoundException(`TimeSlot with ID ${id} not found`)
    }

    if (input.order !== undefined) {
      const conflict = await this.timeSlotRepository.findByOrder(
        input.order,
        id,
      )
      if (conflict) {
        throw new ConflictException(
          `Time slot with order ${input.order} already exists`,
        )
      }
    }

    const updated = await this.timeSlotRepository.update(id, {
      name: input.name,
      startTime: input.startTime,
      endTime: input.endTime,
      order: input.order,
      typeId: input.typeId,
    })
    this.logger.log(`TimeSlot updated: ${id}`)
    return updated
  }
}
