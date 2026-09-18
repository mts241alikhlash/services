import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { IAcademicYearRepository } from '../../../../academic-year/index.js'
import { SemesterWithDetails } from '../../../domain/entities/semester.entity.js'
import { validateSemesterDateRange } from '../../../domain/policies/validate-semester-date-range.policy.js'
import { InvalidSemesterError } from '../../../domain/errors/invalid-semester.error.js'
import { ISemesterRepository } from '../../../domain/repositories/semester.repository.js'
import type { CreateSemesterInput } from './create-semester.input.js'

@Injectable()
export class CreateSemesterUseCase {
  private readonly logger = new Logger(CreateSemesterUseCase.name)

  constructor(
    private readonly semesterRepository: ISemesterRepository,
    private readonly academicYearRepository: IAcademicYearRepository,
  ) {}

  async execute(input: CreateSemesterInput): Promise<SemesterWithDetails> {
    const academicYear = await this.academicYearRepository.findById(
      input.academicYearId,
    )
    if (!academicYear) {
      throw new NotFoundException(
        `Academic Year with ID ${input.academicYearId} not found`,
      )
    }

    const semesterType = await this.semesterRepository.findTypeById(
      input.typeId,
    )
    if (!semesterType) {
      throw new NotFoundException(
        `Semester Type with ID ${input.typeId} not found`,
      )
    }

    const existing = await this.semesterRepository.findByAcademicYearAndType(
      input.academicYearId,
      input.typeId,
    )
    if (existing) {
      throw new ConflictException(
        `Semester "${semesterType.name}" for Academic Year "${academicYear.name}" already exists`,
      )
    }

    try {
      validateSemesterDateRange(input.startDate, input.endDate)
    } catch (error) {
      if (error instanceof InvalidSemesterError) {
        throw new BadRequestException(error.message)
      }
      throw error
    }

    if (input.isActive) {
      await this.semesterRepository.deactivateAll()
    }

    const semester = await this.semesterRepository.create({
      academicYearId: input.academicYearId,
      typeId: input.typeId,
      isActive: input.isActive ?? false,
      ...(input.startDate && { startDate: input.startDate }),
      ...(input.endDate && { endDate: input.endDate }),
    })

    this.logger.log(
      `Semester created: ${semesterType.name} - ${academicYear.name}`,
    )
    return semester
  }
}
