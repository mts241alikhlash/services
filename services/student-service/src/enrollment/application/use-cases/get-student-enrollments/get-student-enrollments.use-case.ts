import { Injectable } from '@nestjs/common'
import { IEnrollmentRepository } from '../../../domain/repositories/enrollment.repository.js'
import type { GetStudentEnrollmentsInput } from './get-student-enrollments.input.js'

@Injectable()
export class GetStudentEnrollmentsUseCase {
  constructor(private readonly enrollmentRepository: IEnrollmentRepository) {}
  async execute(input: GetStudentEnrollmentsInput) {
    return this.enrollmentRepository.findAll({
      page: input.page,
      limit: input.limit,
      studentId: input.studentId,
      classroomId: input.classroomId,
      semesterId: input.semesterId,
      academicYearId: input.academicYearId,
      status: input.status,
    })
  }
}
