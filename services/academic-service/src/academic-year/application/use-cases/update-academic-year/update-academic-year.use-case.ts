import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { AcademicYear } from '../../../domain/entities/academic-year.entity.js'
import {
  validateAcademicYearName,
  validateAcademicYearStartYear,
} from '../../../domain/policies/validate-academic-year.policy.js'
import { InvalidAcademicYearError } from '../../../domain/errors/invalid-academic-year.error.js'
import { IAcademicYearRepository } from '../../../domain/repositories/academic-year.repository.js'
import type { UpdateAcademicYearInput } from './update-academic-year.input.js'

@Injectable()
export class UpdateAcademicYearUseCase {
  private readonly logger = new Logger(UpdateAcademicYearUseCase.name)

  constructor(
    private readonly academicYearRepository: IAcademicYearRepository,
  ) {}

  async execute(
    id: string,
    input: UpdateAcademicYearInput,
  ): Promise<AcademicYear> {
    const current = await this.academicYearRepository.findById(id)
    if (!current) {
      throw new NotFoundException(`Academic Year with ID ${id} not found`)
    }

    try {
      if (input.name !== undefined) validateAcademicYearName(input.name)
      if (input.startYear !== undefined) {
        validateAcademicYearStartYear(input.startYear)
      }
    } catch (error) {
      if (error instanceof InvalidAcademicYearError) {
        throw new BadRequestException(error.message)
      }
      throw error
    }

    if (input.name && input.name !== current.name) {
      const existing = await this.academicYearRepository.findByName(input.name)
      if (existing) {
        throw new ConflictException(
          `Academic Year "${input.name}" already exists`,
        )
      }
    }

    const updated = await this.academicYearRepository.update(id, {
      name: input.name,
      startYear: input.startYear,
    })
    this.logger.log(`Academic Year updated: ${id}`)
    return updated
  }
}
