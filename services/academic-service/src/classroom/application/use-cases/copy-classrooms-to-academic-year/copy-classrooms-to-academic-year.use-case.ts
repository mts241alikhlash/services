import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { IAcademicYearRepository } from '../../../../academic-year/domain/repositories/academic-year.repository.js'
import {
  CopyClassroomsResult,
  IClassroomRepository,
} from '../../../domain/repositories/classroom.repository.js'

@Injectable()
export class CopyClassroomsToAcademicYearUseCase {
  private readonly logger = new Logger(CopyClassroomsToAcademicYearUseCase.name)

  constructor(
    private readonly classroomRepository: IClassroomRepository,
    private readonly academicYearRepository: IAcademicYearRepository,
  ) {}

  async execute(
    sourceAcademicYearId: string,
    targetAcademicYearId: string,
  ): Promise<CopyClassroomsResult> {
    if (sourceAcademicYearId === targetAcademicYearId) {
      throw new BadRequestException(
        'Source and target academic year must be different.',
      )
    }

    const [source, target] = await Promise.all([
      this.academicYearRepository.findById(sourceAcademicYearId),
      this.academicYearRepository.findById(targetAcademicYearId),
    ])

    if (!source) {
      throw new BadRequestException(
        `Academic year ${sourceAcademicYearId} was not found.`,
      )
    }
    if (!target) {
      throw new BadRequestException(
        `Academic year ${targetAcademicYearId} was not found.`,
      )
    }

    const result = await this.classroomRepository.copyToAcademicYear(
      sourceAcademicYearId,
      targetAcademicYearId,
    )

    if (result.created === 0 && result.skipped === 0) {
      throw new BadRequestException(
        `Academic year ${source.name} has no classrooms to copy.`,
      )
    }

    this.logger.log(
      `Copied classrooms ${source.name} → ${target.name}: ` +
        `${result.created} created, ${result.skipped} already there`,
    )

    return result
  }
}
