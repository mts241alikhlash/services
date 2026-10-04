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
import type { UpdateSemesterInput } from './update-semester.input.js'

@Injectable()
export class UpdateSemesterUseCase {
  private readonly logger = new Logger(UpdateSemesterUseCase.name)

  constructor(
    private readonly semesterRepository: ISemesterRepository,
    private readonly academicYearRepository: IAcademicYearRepository,
  ) {}

  async execute(
    id: string,
    input: UpdateSemesterInput,
  ): Promise<SemesterWithDetails> {
    const current = await this.semesterRepository.findById(id)
    if (!current) {
      throw new NotFoundException(`Semester with ID ${id} not found`)
    }

    const movingYear =
      input.academicYearId !== undefined &&
      input.academicYearId !== current.academicYearId
    const movingType =
      input.typeId !== undefined && input.typeId !== current.typeId

    if (movingYear || movingType) {
      const dependent = await this.semesterRepository.findFirstDependent(id)
      if (dependent) {
        throw new ConflictException(
          `This semester already has ${dependent}, so its academic year and ` +
            'type can no longer be changed. Create a new semester in the ' +
            'target academic year instead.',
        )
      }
    }

    if (movingYear && input.academicYearId) {
      const academicYear = await this.academicYearRepository.findById(
        input.academicYearId,
      )
      if (!academicYear) {
        throw new NotFoundException(
          `Academic Year with ID ${input.academicYearId} not found`,
        )
      }
    }

    if (input.typeId) {
      const semesterType = await this.semesterRepository.findTypeById(
        input.typeId,
      )
      if (!semesterType) {
        throw new NotFoundException(
          `Semester Type with ID ${input.typeId} not found`,
        )
      }
    }

    if (input.typeId || input.academicYearId) {
      const checkAyId = input.academicYearId ?? current.academicYearId
      const checkTypeId = input.typeId ?? current.typeId

      const existing = await this.semesterRepository.findByAcademicYearAndType(
        checkAyId,
        checkTypeId,
      )
      if (existing && existing.id !== id) {
        throw new ConflictException(
          'Semester already exists for this Academic Year',
        )
      }
    }

    const checkStartDate =
      input.startDate !== undefined ? input.startDate : current.startDate
    const checkEndDate =
      input.endDate !== undefined ? input.endDate : current.endDate

    try {
      validateSemesterDateRange(checkStartDate, checkEndDate)
    } catch (error) {
      if (error instanceof InvalidSemesterError) {
        throw new BadRequestException(error.message)
      }
      throw error
    }

    const updated = await this.semesterRepository.update(id, {
      academicYearId: input.academicYearId,
      typeId: input.typeId,
      startDate: input.startDate,
      endDate: input.endDate,
    })
    this.logger.log(`Semester updated: ${id}`)
    return updated
  }
}
