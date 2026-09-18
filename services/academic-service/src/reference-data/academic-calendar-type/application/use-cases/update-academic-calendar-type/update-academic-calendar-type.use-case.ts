import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { AcademicCalendarTypeEntity } from '../../../domain/entities/academic-calendar-type.entity.js'
import { IAcademicCalendarTypeRepository } from '../../../domain/repositories/academic-calendar-type.repository.js'
import type { UpdateAcademicCalendarTypeInput } from './update-academic-calendar-type.input.js'

@Injectable()
export class UpdateAcademicCalendarTypeUseCase {
  private readonly logger = new Logger(UpdateAcademicCalendarTypeUseCase.name)

  constructor(
    private readonly academicCalendarTypeRepository: IAcademicCalendarTypeRepository,
  ) {}

  async execute(
    id: string,
    input: UpdateAcademicCalendarTypeInput,
  ): Promise<AcademicCalendarTypeEntity> {
    const item = await this.academicCalendarTypeRepository.findById(id)
    if (!item) {
      throw new NotFoundException(
        `AcademicCalendarType with ID ${id} not found`,
      )
    }

    if (input.name) {
      const existing = await this.academicCalendarTypeRepository.findByName(
        input.name,
        id,
      )
      if (existing) {
        throw new ConflictException(
          `AcademicCalendarType with name "${input.name}" already exists`,
        )
      }
    }

    const updated = await this.academicCalendarTypeRepository.update(id, {
      name: input.name,
      isActive: input.isActive,
    })
    this.logger.log(`AcademicCalendarType updated: ${updated.name}`)
    return updated
  }
}
