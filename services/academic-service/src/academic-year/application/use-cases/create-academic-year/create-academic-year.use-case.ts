import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common'
import { AcademicYear } from '../../../domain/entities/academic-year.entity.js'
import {
  validateAcademicYearName,
  validateAcademicYearStartYear,
} from '../../../domain/policies/validate-academic-year.policy.js'
import { InvalidAcademicYearError } from '../../../domain/errors/invalid-academic-year.error.js'
import { IAcademicYearRepository } from '../../../domain/repositories/academic-year.repository.js'
import type { CreateAcademicYearInput } from './create-academic-year.input.js'

@Injectable()
export class CreateAcademicYearUseCase {
  private readonly logger = new Logger(CreateAcademicYearUseCase.name)

  constructor(
    private readonly academicYearRepository: IAcademicYearRepository,
  ) {}

  async execute(input: CreateAcademicYearInput): Promise<AcademicYear> {
    try {
      validateAcademicYearName(input.name)
      validateAcademicYearStartYear(input.startYear)
    } catch (error) {
      if (error instanceof InvalidAcademicYearError) {
        throw new BadRequestException(error.message)
      }
      throw error
    }

    const existing = await this.academicYearRepository.findByName(input.name)
    if (existing) {
      throw new ConflictException(
        `Academic Year "${input.name}" already exists`,
      )
    }

    if (input.isActive) {
      await this.academicYearRepository.deactivateAll()
    }

    const academicYear = await this.academicYearRepository.create({
      name: input.name,
      startYear: input.startYear,
      isActive: input.isActive ?? false,
    })

    this.logger.log(`Academic Year created: ${input.name}`)

    return academicYear
  }
}
