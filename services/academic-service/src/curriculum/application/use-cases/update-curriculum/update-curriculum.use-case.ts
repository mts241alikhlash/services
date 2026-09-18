import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { IAcademicYearRepository } from '../../../../academic-year/index.js'
import { ICurriculumRepository } from '../../../domain/repositories/curriculum.repository.js'
import type { UpdateCurriculumInput } from './update-curriculum.input.js'

@Injectable()
export class UpdateCurriculaUseCase {
  private readonly logger = new Logger(UpdateCurriculaUseCase.name)

  constructor(
    private readonly curriculumRepository: ICurriculumRepository,
    private readonly academicYearRepository: IAcademicYearRepository,
  ) {}

  async execute(id: string, input: UpdateCurriculumInput) {
    const current = await this.curriculumRepository.findById(id)
    if (!current) {
      throw new NotFoundException(`Curricula with ID ${id} not found`)
    }

    if (
      input.academicYearId &&
      input.academicYearId !== current.academicYearId
    ) {
      const academicYear = await this.academicYearRepository.findById(
        input.academicYearId,
      )
      if (!academicYear) {
        throw new NotFoundException(
          `Academic Year with ID ${input.academicYearId} not found`,
        )
      }
    }

    const newAcademicYearId = input.academicYearId ?? current.academicYearId
    const newName = input.name ?? current.name

    if (
      newAcademicYearId !== current.academicYearId ||
      newName !== current.name
    ) {
      const duplicate =
        await this.curriculumRepository.findByNameAndAcademicYear(
          newName,
          newAcademicYearId,
          id,
        )
      if (duplicate) {
        throw new ConflictException(
          `Curricula with name "${newName}" already exists in this academic year`,
        )
      }
    }

    const updated = await this.curriculumRepository.update(id, {
      academicYearId: input.academicYearId,
      name: input.name,
      isActive: input.isActive,
    })
    this.logger.log(`Curricula updated: ${id}`)
    return updated
  }
}
