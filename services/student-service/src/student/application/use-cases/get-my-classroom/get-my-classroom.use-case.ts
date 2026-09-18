import { Injectable } from '@nestjs/common'
import {
  EnrollmentWithDetails,
  IEnrollmentRepository,
} from '../../../../enrollment/domain/repositories/enrollment.repository.js'
import { IStudentIdentityReadPort } from '../../../domain/repositories/student-identity-read.port.js'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import {
  CLASSMATE_LIMIT,
  SUBJECT_LIMIT,
} from '../../../constants/my-classroom.constants.js'

export interface MyClassroom {
  classroom: unknown
  structure: unknown
  supervisor: unknown
  classmates: EnrollmentWithDetails[]
  subjects: unknown[]
}

@Injectable()
export class GetMyClassroomUseCase {
  constructor(
    private readonly enrollmentRepository: IEnrollmentRepository,
    private readonly academicLookup: IAcademicLookupPort,
    private readonly studentIdentity: IStudentIdentityReadPort,
  ) {}

  async execute(userId: string): Promise<MyClassroom | null> {
    const studentId = await this.studentIdentity.findStudentIdByUserId(userId)
    if (!studentId) return null

    const enrollment =
      await this.enrollmentRepository.findActiveEnrollment(studentId)
    if (!enrollment?.classroomId) return null

    const [context, classmates] = await Promise.all([
      this.academicLookup.findClassroomContext(
        enrollment.classroomId,
        enrollment.semesterId,
        SUBJECT_LIMIT,
      ),
      this.enrollmentRepository.findAll({
        classroomId: enrollment.classroomId,
        semesterId: enrollment.semesterId,
        page: 1,
        limit: CLASSMATE_LIMIT,
      }),
    ])
    if (!context) return null

    return {
      classroom: context.classroom,
      structure: context.structure,
      supervisor: context.supervisor,
      classmates: classmates.data,
      subjects: context.subjects,
    }
  }
}
