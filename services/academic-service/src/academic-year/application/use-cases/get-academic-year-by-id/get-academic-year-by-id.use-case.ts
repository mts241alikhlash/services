import { Injectable, NotFoundException } from '@nestjs/common'
import { AcademicYear } from '../../../domain/entities/academic-year.entity.js'
import { IAcademicYearRepository } from '../../../domain/repositories/academic-year.repository.js'

@Injectable()
export class GetAcademicYearByIdUseCase {
  constructor(
    private readonly academicYearRepository: IAcademicYearRepository,
  ) {}

  async execute(id: string): Promise<AcademicYear> {
    const year = await this.academicYearRepository.findById(id)
    if (!year) {
      throw new NotFoundException(`Academic Year with ID ${id} not found`)
    }
    return year
  }
}
