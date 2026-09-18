import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import {
  EnrollmentStatus,
  IEnrollmentRepository,
} from '../../../domain/repositories/enrollment.repository.js'
import { ClassroomCapacityService } from '../../services/classroom-capacity.service.js'
import type { BulkTransferStudentInput } from './bulk-transfer-student.input.js'

@Injectable()
export class BulkTransferStudentUseCase {
  private readonly logger = new Logger(BulkTransferStudentUseCase.name)

  constructor(
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly classroomCapacity: ClassroomCapacityService,
  ) {}

  async execute(input: BulkTransferStudentInput) {
    const results: { id: string; success: boolean; error?: string }[] = []
    const transferable: { id: string; semesterId: string; moving: boolean }[] =
      []

    for (const enrollmentId of input.enrollmentIds) {
      const enrollment = await this.enrollmentRepository.findById(enrollmentId)
      if (!enrollment) {
        results.push({
          id: enrollmentId,
          success: false,
          error: `Enrollment ${enrollmentId} not found`,
        })
        continue
      }

      if (enrollment.status !== EnrollmentStatus.ACTIVE) {
        results.push({
          id: enrollmentId,
          success: false,
          error: `Cannot transfer: status is ${enrollment.status}`,
        })
        continue
      }

      transferable.push({
        id: enrollmentId,
        semesterId: enrollment.semesterId,
        moving: enrollment.classroomId !== input.targetClassroomId,
      })
    }

    const semesterIds = new Set(transferable.map((t) => t.semesterId))
    if (semesterIds.size > 1) {
      throw new BadRequestException(
        'Cannot transfer enrollments from more than one semester at a time',
      )
    }

    const [semesterId] = [...semesterIds]
    if (semesterId) {
      await this.classroomCapacity.assertRoomFor({
        classroomId: input.targetClassroomId,
        semesterId,
        incoming: transferable.filter((t) => t.moving).length,
      })
    }

    for (const { id } of transferable) {
      await this.enrollmentRepository.update(id, {
        classroomId: input.targetClassroomId,
        note: input.note,
      })
      results.push({ id, success: true })
    }

    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    this.logger.log(
      `Bulk transfer: ${successCount} success, ${failCount} failed to classroom ${input.targetClassroomId}`,
    )

    return { results, successCount, failCount }
  }
}
