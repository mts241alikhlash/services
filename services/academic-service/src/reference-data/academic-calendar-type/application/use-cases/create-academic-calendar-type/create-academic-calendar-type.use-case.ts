import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { AcademicCalendarTypeEntity } from '../../../domain/entities/academic-calendar-type.entity.js'
import { IAcademicCalendarTypeRepository } from '../../../domain/repositories/academic-calendar-type.repository.js'
import type { CreateAcademicCalendarTypeInput } from './create-academic-calendar-type.input.js'

@Injectable()
export class CreateAcademicCalendarTypeUseCase {
  private readonly logger = new Logger(CreateAcademicCalendarTypeUseCase.name)

  constructor(
    private readonly academicCalendarTypeRepository: IAcademicCalendarTypeRepository,
  ) {}

  async execute(
    input: CreateAcademicCalendarTypeInput,
  ): Promise<AcademicCalendarTypeEntity> {
    const existing = await this.academicCalendarTypeRepository.findByName(
      input.name,
    )
    if (existing) {
      throw new ConflictException(
        `AcademicCalendarType with name "${input.name}" already exists`,
      )
    }

    const item = await this.academicCalendarTypeRepository.create({
      name: input.name,
      isActive: input.isActive,
    })

    this.logger.log(`AcademicCalendarType created: ${item.name}`)
    return item
  }
}
