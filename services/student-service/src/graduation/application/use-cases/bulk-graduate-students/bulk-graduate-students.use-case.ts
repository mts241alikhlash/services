import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { IGraduationRepository } from '../../../domain/repositories/graduation.repository.js'
import type { BulkGraduationResult } from '../../../domain/repositories/graduation.repository.js'
import type { BulkGraduateStudentsInput } from './bulk-graduate-students.input.js'

@Injectable()
export class BulkGraduateStudentsUseCase {
  private readonly logger = new Logger(BulkGraduateStudentsUseCase.name)

  constructor(private readonly graduationRepository: IGraduationRepository) {}

  async execute(
    input: BulkGraduateStudentsInput,
  ): Promise<BulkGraduationResult> {
    const held = input.held ?? []

    if (input.students.length === 0 && held.length === 0) {
      throw new BadRequestException('No students selected')
    }

    const ids = input.students.map((s) => s.studentId)
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Duplicate students in the request')
    }

    const heldIds = held.map((s) => s.studentId)
    if (new Set(heldIds).size !== heldIds.length) {
      throw new BadRequestException('Duplicate students in the held list')
    }

    const inBoth = heldIds.filter((id) => ids.includes(id))
    if (inBoth.length > 0) {
      throw new BadRequestException(
        `A student cannot be graduated and held at once: ${inBoth.join(', ')}`,
      )
    }

    const academicYearId =
      await this.graduationRepository.findActiveAcademicYearId()
    if (!academicYearId) {
      throw new BadRequestException(
        'No active semester; set one before graduating a cohort',
      )
    }

    const result = await this.graduationRepository.executeBulk({
      academicYearId,
      ...(input.graduationDate && {
        graduationDate: new Date(input.graduationDate),
      }),
      students: input.students,
      ...(held.length > 0 && { held }),
    })

    this.logger.log(
      `Bulk graduation: ${result.graduated} graduated, ` +
        `${result.skipped} skipped, ${result.held} held`,
    )

    return result
  }
}
