import { Injectable } from '@nestjs/common'
import { ITeachingAssignmentRepository } from '../../../domain/repositories/teaching-assignment.repository.js'
import type { GetTeachingAssignmentsInput } from './get-teaching-assignments.input.js'

@Injectable()
export class GetTeachingAssignmentsUseCase {
  constructor(
    private readonly teachingAssignmentRepository: ITeachingAssignmentRepository,
  ) {}

  async execute(input: GetTeachingAssignmentsInput) {
    return this.teachingAssignmentRepository.findAll({
      page: input.page,
      limit: input.limit,
      employeeId: input.employeeId,
      classroomId: input.classroomId,
      subjectId: input.subjectId,
      semesterId: input.semesterId,
    })
  }
}
