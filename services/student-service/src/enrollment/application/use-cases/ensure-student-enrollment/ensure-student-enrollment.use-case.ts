import { Injectable, Logger } from '@nestjs/common'
import { IEnrollmentRepository } from '../../../domain/repositories/enrollment.repository.js'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { CreateStudentEnrollmentUseCase } from '../create-student-enrollment/create-student-enrollment.use-case.js'
import { TransferStudentUseCase } from '../transfer-student/transfer-student.use-case.js'

@Injectable()
export class EnsureStudentEnrollmentUseCase {
  private readonly logger = new Logger(EnsureStudentEnrollmentUseCase.name)

  constructor(
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly academicLookup: IAcademicLookupPort,
    private readonly createStudentEnrollment: CreateStudentEnrollmentUseCase,
    private readonly transferStudent: TransferStudentUseCase,
  ) {}

  async execute(studentId: string, classroomId: string): Promise<void> {
    const activeSemester = await this.academicLookup.findActiveSemester()
    if (!activeSemester) {
      this.logger.warn(
        `No active semester found; skipping enrollment for student ${studentId}`,
      )
      return
    }

    const existing = await this.enrollmentRepository.findDuplicate(
      studentId,
      activeSemester.id,
    )

    if (!existing) {
      await this.createStudentEnrollment.execute({
        studentId,
        classroomId,
        semesterId: activeSemester.id,
      })
      this.logger.log(
        `Enrolled student ${studentId} in classroom ${classroomId}`,
      )
      return
    }

    if (existing.classroomId === classroomId) {
      return
    }

    await this.transferStudent.execute(existing.id, {
      targetClassroomId: classroomId,
    })
    this.logger.log(
      `Transferred student ${studentId} to classroom ${classroomId}`,
    )
  }
}
