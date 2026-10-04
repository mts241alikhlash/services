import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { IAcademicYearRepository } from '../../../../academic-year/index.js'
import { SemesterWithDetails } from '../../../domain/entities/semester.entity.js'
import { ISemesterRepository } from '../../../domain/repositories/semester.repository.js'

@Injectable()
export class ActivateSemesterUseCase {
  private readonly logger = new Logger(ActivateSemesterUseCase.name)

  constructor(
    private readonly semesterRepository: ISemesterRepository,
    private readonly academicYearRepository: IAcademicYearRepository,
  ) {}

  async execute(id: string): Promise<SemesterWithDetails> {
    const current = await this.semesterRepository.findById(id)
    if (!current) {
      throw new NotFoundException(`Semester with ID ${id} not found`)
    }

    if (current.isActive) {
      return current
    }

    const academicYear = await this.academicYearRepository.findById(
      current.academicYear.id,
    )
    if (!academicYear?.isActive) {
      throw new BadRequestException(
        'Cannot activate semester: its academic year is not active',
      )
    }

    const activated = await this.semesterRepository.activateById(id)
    this.logger.log(`Semester activated: ${id}`)
    return activated
  }
}
