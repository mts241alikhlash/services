import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { AcademicCalendarTypeEntity } from '../../../domain/entities/academic-calendar-type.entity.js'
import { IAcademicCalendarTypeRepository } from '../../../domain/repositories/academic-calendar-type.repository.js'

@Injectable()
export class DeleteAcademicCalendarTypeUseCase {
  private readonly logger = new Logger(DeleteAcademicCalendarTypeUseCase.name)

  constructor(
    private readonly academicCalendarTypeRepository: IAcademicCalendarTypeRepository,
  ) {}

  async execute(id: string): Promise<AcademicCalendarTypeEntity> {
    const item = await this.academicCalendarTypeRepository.findById(id)
    if (!item) {
      throw new NotFoundException(
        `AcademicCalendarType with ID ${id} not found`,
      )
    }

    const deleted = await this.academicCalendarTypeRepository.softDelete(id)
    this.logger.log(`AcademicCalendarType deleted: ${item.name}`)
    return deleted
  }
}
