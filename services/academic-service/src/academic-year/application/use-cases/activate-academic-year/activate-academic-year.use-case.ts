import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { AcademicYear } from '../../../domain/entities/academic-year.entity.js'
import { IAcademicYearRepository } from '../../../domain/repositories/academic-year.repository.js'

@Injectable()
export class ActivateAcademicYearUseCase {
  private readonly logger = new Logger(ActivateAcademicYearUseCase.name)

  constructor(
    private readonly academicYearRepository: IAcademicYearRepository,
  ) {}

  async execute(id: string): Promise<AcademicYear> {
    const current = await this.academicYearRepository.findById(id)
    if (!current) {
      throw new NotFoundException(`Academic Year with ID ${id} not found`)
    }

    if (current.isActive) {
      return current
    }

    const activated = await this.academicYearRepository.activateById(id)
    this.logger.log(`Academic Year activated: ${id}`)
    return activated
  }
}
