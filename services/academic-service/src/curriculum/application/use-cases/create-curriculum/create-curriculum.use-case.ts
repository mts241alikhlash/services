import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { IAcademicYearRepository } from '../../../../academic-year/index.js'
import { ICurriculumRepository } from '../../../domain/repositories/curriculum.repository.js'
import type { CreateCurriculumInput } from './create-curriculum.input.js'

@Injectable()
export class CreateCurriculaUseCase {
  private readonly logger = new Logger(CreateCurriculaUseCase.name)

  constructor(
    private readonly curriculumRepository: ICurriculumRepository,
    private readonly academicYearRepository: IAcademicYearRepository,
  ) {}

  async execute(input: CreateCurriculumInput) {
    const academicYear = await this.academicYearRepository.findById(
      input.academicYearId,
    )
    if (!academicYear) {
      throw new NotFoundException(
        `Academic Year with ID ${input.academicYearId} not found`,
      )
    }

    const existing = await this.curriculumRepository.findByNameAndAcademicYear(
      input.name,
      input.academicYearId,
    )
    if (existing) {
      throw new ConflictException(
        `Curricula with name "${input.name}" already exists in this academic year`,
      )
    }

    const curricula = await this.curriculumRepository.create({
      academicYearId: input.academicYearId,
      name: input.name,
      isActive: input.isActive,
    })

    this.logger.log(`Curricula created: ${input.name}`)
    return curricula
  }
}
