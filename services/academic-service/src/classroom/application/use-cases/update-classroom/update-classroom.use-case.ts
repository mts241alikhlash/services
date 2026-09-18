import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { IClassroomRepository } from '../../../domain/repositories/classroom.repository.js'
import { withDisplayName } from '../../../../shared/utils/classroom-display-name.helper.js'
import type { UpdateClassroomInput } from './update-classroom.input.js'

@Injectable()
export class UpdateClassroomUseCase {
  private readonly logger = new Logger(UpdateClassroomUseCase.name)

  constructor(private readonly classroomRepository: IClassroomRepository) {}

  async execute(id: string, input: UpdateClassroomInput) {
    const current = await this.classroomRepository.findById(id)
    if (!current) {
      throw new NotFoundException(`Classroom with ID ${id} not found`)
    }

    const movingYear =
      input.academicYearId !== undefined &&
      input.academicYearId !== current.academicYearId
    const movingGrade =
      input.gradeId !== undefined && input.gradeId !== current.gradeId

    if (movingYear || movingGrade) {
      const [enrollments, assignments] = await Promise.all([
        this.classroomRepository.countEnrollments(id),
        this.classroomRepository.countTeachingAssignments(id),
      ])

      if (enrollments > 0 || assignments > 0) {
        throw new ConflictException(
          `This classroom already has ${enrollments} enrolment(s) and ` +
            `${assignments} teaching assignment(s), so its academic year and ` +
            'grade can no longer be changed. Create a classroom in the target ' +
            'academic year instead.',
        )
      }
    }

    const academicYearId = input.academicYearId ?? current.academicYearId
    const code = input.code ?? current.code

    const hasChanged =
      academicYearId !== current.academicYearId || code !== current.code

    if (hasChanged) {
      const duplicate = await this.classroomRepository.findDuplicate(
        code,
        academicYearId,
        id,
      )
      if (duplicate) {
        throw new ConflictException(
          `Classroom code "${code}" already exists for this configuration`,
        )
      }
    }

    const updated = await this.classroomRepository.update(id, {
      academicYearId: input.academicYearId,
      gradeId: input.gradeId,
      code: input.code,
      name: input.name,
      capacity: input.capacity,
      isActive: input.isActive,
    })
    this.logger.log(`Class updated: ${id}`)
    return withDisplayName(updated)
  }
}
