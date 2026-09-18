import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ITeachingAssignmentRepository } from '../../../domain/repositories/teaching-assignment.repository.js'
import type { UpdateTeachingAssignmentInput } from './update-teaching-assignment.input.js'

@Injectable()
export class UpdateTeachingAssignmentUseCase {
  constructor(
    private readonly teachingAssignmentRepository: ITeachingAssignmentRepository,
  ) {}

  async execute(id: string, input: UpdateTeachingAssignmentInput) {
    const current = await this.teachingAssignmentRepository.findById(id)
    if (!current)
      throw new NotFoundException(`Teaching assignment ${id} not found`)

    const eId = input.employeeId ?? current.employeeId
    const cId = input.classroomId ?? current.classroomId
    const sId = input.subjectId ?? current.subjectId
    const smId = input.semesterId ?? current.semesterId

    if (input.classroomId || input.semesterId) {
      const [classroom, semester] = await Promise.all([
        this.teachingAssignmentRepository.findClassroomById(cId),
        this.teachingAssignmentRepository.findSemesterById(smId),
      ])

      if (
        classroom &&
        semester &&
        classroom.academicYearId !== semester.academicYearId
      ) {
        throw new BadRequestException(
          'Classroom and semester must belong to the same academic year',
        )
      }
    }

    if (
      eId !== current.employeeId ||
      cId !== current.classroomId ||
      sId !== current.subjectId ||
      smId !== current.semesterId
    ) {
      const dup = await this.teachingAssignmentRepository.findDuplicate(
        eId,
        cId,
        sId,
        smId,
        id,
      )
      if (dup) throw new ConflictException('Teaching assignment already exists')
    }

    return this.teachingAssignmentRepository.update(id, {
      employeeId: input.employeeId,
      classroomId: input.classroomId,
      subjectId: input.subjectId,
      semesterId: input.semesterId,
      passingScore: input.passingScore,
    })
  }
}
