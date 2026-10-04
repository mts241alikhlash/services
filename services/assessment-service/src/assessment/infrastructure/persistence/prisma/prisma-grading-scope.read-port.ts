import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import { IGradingScopeReadPort } from '../../../domain/repositories/grading-scope-read.port.js'

@Injectable()
export class PrismaGradingScopeReadPort extends IGradingScopeReadPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly academicLookup: IAcademicLookupPort,
    private readonly enrollmentLookup: IEnrollmentLookupPort,
  ) {
    super()
  }

  async teachesAssessmentItem(
    employeeId: string,
    assessmentItemId: string,
  ): Promise<boolean> {
    const item = await this.prisma.assessmentItem.findFirst({
      where: { id: assessmentItemId, deletedAt: null },
      select: { teachingAssignmentId: true },
    })
    if (!item) return false

    return this.academicLookup.teachingAssignmentBelongsTo(
      item.teachingAssignmentId,
      employeeId,
    )
  }

  async supervisesEnrollment(
    employeeId: string,
    enrollmentId: string,
  ): Promise<boolean> {
    const enrolment = await this.enrollmentLookup.findSummary(enrollmentId)
    if (!enrolment) return false

    return this.academicLookup.supervisesClassroom(
      employeeId,
      enrolment.classroomId,
      enrolment.semesterId,
    )
  }
}
