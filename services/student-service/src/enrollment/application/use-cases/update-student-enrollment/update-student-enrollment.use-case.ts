import { Injectable, NotFoundException } from '@nestjs/common'
import { IEnrollmentRepository } from '../../../domain/repositories/enrollment.repository.js'
import type { UpdateStudentEnrollmentInput } from './update-student-enrollment.input.js'

@Injectable()
export class UpdateStudentEnrollmentUseCase {
  constructor(private readonly enrollmentRepository: IEnrollmentRepository) {}
  async execute(id: string, input: UpdateStudentEnrollmentInput) {
    const enrollment = await this.enrollmentRepository.findById(id)
    if (!enrollment) {
      throw new NotFoundException(`StudentEnrollment ${id} not found`)
    }
    const { endedAt, ...rest } = input
    return this.enrollmentRepository.update(id, {
      ...rest,
      ...(endedAt !== undefined && { endedAt: new Date(endedAt) }),
    })
  }
}
