import { Injectable, NotFoundException } from '@nestjs/common'
import { IEnrollmentRepository } from '../../../domain/repositories/enrollment.repository.js'

@Injectable()
export class DeleteStudentEnrollmentUseCase {
  constructor(private readonly enrollmentRepository: IEnrollmentRepository) {}
  async execute(id: string) {
    const enrollment = await this.enrollmentRepository.findById(id)
    if (!enrollment) {
      throw new NotFoundException(`StudentEnrollment ${id} not found`)
    }
    return this.enrollmentRepository.softDelete(id)
  }
}
