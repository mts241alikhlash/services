import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AcademicYear } from '../../../domain/entities/academic-year.entity.js'
import { IAcademicYearRepository } from '../../../domain/repositories/academic-year.repository.js'

@Injectable()
export class DeactivateAcademicYearUseCase {
  constructor(
    private readonly academicYearRepository: IAcademicYearRepository,
  ) {}

  async execute(id: string): Promise<AcademicYear> {
    const current = await this.academicYearRepository.findById(id)
    if (!current) {
      throw new NotFoundException(`Academic Year with ID ${id} not found`)
    }

    if (!current.isActive) {
      return current
    }

    const activeCount = await this.academicYearRepository.countActive()
    if (activeCount <= 1) {
      throw new BadRequestException(
        'Cannot deactivate the only active academic year. Activate another one first.',
      )
    }

    const hasData = await this.academicYearRepository.hasRelatedData(id)
    if (hasData) {
      throw new BadRequestException(
        'Cannot deactivate academic year that has active enrollment data. ' +
          'Complete, promote, or drop all active enrollments first.',
      )
    }

    const deactivated = await this.academicYearRepository.update(id, {
      isActive: false,
    })

    await this.academicYearRepository.deactivateSemestersByAcademicYearId(id)

    return deactivated
  }
}
