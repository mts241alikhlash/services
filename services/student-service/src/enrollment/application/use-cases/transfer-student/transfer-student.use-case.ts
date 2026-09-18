import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import {
  EnrollmentStatus,
  IEnrollmentRepository,
} from '../../../domain/repositories/enrollment.repository.js'
import { ClassroomCapacityService } from '../../services/classroom-capacity.service.js'
import type { TransferStudentInput } from './transfer-student.input.js'

@Injectable()
export class TransferStudentUseCase {
  private readonly logger = new Logger(TransferStudentUseCase.name)

  constructor(
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly classroomCapacity: ClassroomCapacityService,
  ) {}

  async execute(enrollmentId: string, input: TransferStudentInput) {
    const enrollment = await this.enrollmentRepository.findById(enrollmentId)
    if (!enrollment) {
      throw new NotFoundException(`StudentEnrollment ${enrollmentId} not found`)
    }

    if (enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot transfer: enrollment status is ${enrollment.status}`,
      )
    }

    await this.classroomCapacity.assertRoomFor({
      classroomId: input.targetClassroomId,
      semesterId: enrollment.semesterId,
      incoming: enrollment.classroomId === input.targetClassroomId ? 0 : 1,
    })

    const updated = await this.enrollmentRepository.update(enrollmentId, {
      classroomId: input.targetClassroomId,
      note: input.note,
    })

    this.logger.log(
      `Transferred enrollment ${enrollmentId} to classroom ${input.targetClassroomId}`,
    )

    return updated
  }
}
