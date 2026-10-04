import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common'
import { ITeachingAssignmentRepository } from '../../../domain/repositories/teaching-assignment.repository.js'
import {
  BulkAssignmentResult,
  SKIP_ALREADY_ASSIGNED,
  SkippedClassroom,
} from '../../../domain/entities/bulk-assignment.entity.js'
import type { CreateTeachingAssignmentInput } from './create-teaching-assignment.input.js'

@Injectable()
export class CreateTeachingAssignmentUseCase {
  constructor(
    private readonly teachingAssignmentRepository: ITeachingAssignmentRepository,
  ) {}

  async execute(
    input: CreateTeachingAssignmentInput,
  ): Promise<BulkAssignmentResult> {
    const semester = await this.teachingAssignmentRepository.findSemesterById(
      input.semesterId,
    )
    if (!semester) {
      throw new BadRequestException('Semester not found')
    }

    const classroomIds = [...new Set(input.classroomIds)]

    for (const classroomId of classroomIds) {
      const classroom =
        await this.teachingAssignmentRepository.findClassroomById(classroomId)

      if (!classroom) {
        throw new BadRequestException(`Classroom ${classroomId} not found`)
      }
      if (classroom.academicYearId !== semester.academicYearId) {
        throw new BadRequestException(
          'Classroom and semester must belong to the same academic year',
        )
      }
    }

    const created: BulkAssignmentResult['created'] = []
    const skipped: SkippedClassroom[] = []

    for (const classroomId of classroomIds) {
      const duplicate = await this.teachingAssignmentRepository.findDuplicate(
        input.employeeId,
        classroomId,
        input.subjectId,
        input.semesterId,
      )
      if (duplicate) {
        skipped.push({ classroomId, reason: SKIP_ALREADY_ASSIGNED })
        continue
      }

      const rowInput = {
        employeeId: input.employeeId,
        classroomId,
        subjectId: input.subjectId,
        semesterId: input.semesterId,
      }

      const softDeleted =
        await this.teachingAssignmentRepository.findSoftDeleted(
          input.employeeId,
          classroomId,
          input.subjectId,
          input.semesterId,
        )

      created.push(
        softDeleted
          ? await this.teachingAssignmentRepository.restore(
              softDeleted.id,
              rowInput,
            )
          : await this.teachingAssignmentRepository.create(rowInput),
      )
    }

    if (created.length === 0) {
      throw new ConflictException(
        'Teaching assignment already exists for every selected classroom',
      )
    }

    return { created, skipped }
  }
}
