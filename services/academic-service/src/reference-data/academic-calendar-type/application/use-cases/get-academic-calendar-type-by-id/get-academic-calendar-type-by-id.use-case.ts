import { Injectable, NotFoundException } from '@nestjs/common'
import { AcademicCalendarTypeEntity } from '../../../domain/entities/academic-calendar-type.entity.js'
import { IAcademicCalendarTypeRepository } from '../../../domain/repositories/academic-calendar-type.repository.js'

@Injectable()
export class GetAcademicCalendarTypeByIdUseCase {
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
    return item
  }
}
