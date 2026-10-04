import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import {
  IRolloverRepository,
  RolloverResult,
  RolloverSourceData,
} from '../../../domain/repositories/rollover.repository.js'
import {
  copyClassrooms,
  copySupervisors,
  emptyRolloverResult,
} from './prisma-rollover.steps.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import { copyAssignmentsWithSchedules } from './prisma-rollover.assignment-step.js'

const ROLLOVER_TX_OPTIONS = { maxWait: 10000, timeout: 30000 }

@Injectable()
export class PrismaRolloverRepository extends IRolloverRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollmentLookup: IEnrollmentLookupPort,
  ) {
    super()
  }

  async findSemesterWithAcademicYear(id: string) {
    return this.prisma.semester.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, academicYearId: true, typeId: true },
    })
  }

  async fetchSourceData(
    sourceSemesterId: string,
    sourceAcademicYearId: string,
  ): Promise<RolloverSourceData> {
    const [classrooms, supervisors, assignments] = await Promise.all([
      this.prisma.classroom.findMany({
        where: { academicYearId: sourceAcademicYearId, deletedAt: null },
      }),
      this.prisma.classroomSupervisor.findMany({
        where: { semesterId: sourceSemesterId, deletedAt: null },
      }),
      this.prisma.teachingAssignment.findMany({
        where: { semesterId: sourceSemesterId, deletedAt: null },
        include: { schedules: { where: { deletedAt: null } } },
      }),
    ])

    return { classrooms, supervisors, assignments }
  }

  async executeRollover(
    sourceData: RolloverSourceData,
    targetSemesterId: string,
    targetAcademicYearId: string,
    sourceSemesterId: string,
  ): Promise<RolloverResult> {
    const { result, classroomIdMap } = await this.prisma.$transaction(
      async (tx) => {
        const result = emptyRolloverResult()

        const classroomIdMap = await copyClassrooms(
          tx,
          sourceData.classrooms,
          targetAcademicYearId,
          result,
        )

        await copySupervisors(
          tx,
          sourceData.supervisors,
          classroomIdMap,
          targetSemesterId,
          result,
        )

        await copyAssignmentsWithSchedules(
          tx,
          sourceData.assignments,
          classroomIdMap,
          targetSemesterId,
          result,
        )

        return { result, classroomIdMap }
      },
      ROLLOVER_TX_OPTIONS,
    )

    result.enrollments = await this.enrollmentLookup.rolloverToSemester(
      sourceSemesterId,
      targetSemesterId,
      classroomIdMap,
    )

    return result
  }
}
