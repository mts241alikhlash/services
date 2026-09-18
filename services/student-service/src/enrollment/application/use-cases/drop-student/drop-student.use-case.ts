import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import {
  EnrollmentStatus,
  IEnrollmentRepository,
  StudentStatus,
} from '../../../domain/repositories/enrollment.repository.js'
import { IStudentRepository } from '../../../../student/domain/repositories/student.repository.js'
import type { DropStudentInput } from './drop-student.input.js'

@Injectable()
export class DropStudentUseCase {
  private readonly logger = new Logger(DropStudentUseCase.name)

  constructor(
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly studentRepository: IStudentRepository,
  ) {}

  async execute(enrollmentId: string, input: DropStudentInput) {
    const enrollment = await this.enrollmentRepository.findById(enrollmentId)
    if (!enrollment) {
      throw new NotFoundException(`StudentEnrollment ${enrollmentId} not found`)
    }

    if (enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot drop: enrollment status is ${enrollment.status}`,
      )
    }

    const updated = await this.enrollmentRepository.update(enrollmentId, {
      status: EnrollmentStatus.DROPPED,
      endedAt: new Date(),
      ...(input.note && { note: input.note }),
    })

    if (enrollment.studentId) {
      await this.studentRepository.updateStatus(
        enrollment.studentId,
        StudentStatus.DROPPED,
      )
    }

    this.logger.log(`Dropped enrollment ${enrollmentId}`)

    return updated
  }
}
