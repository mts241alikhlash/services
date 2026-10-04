import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { resolveUserRefs } from '../../../../shared/utils/resolve-user-refs.helper.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import { DayEnum } from '../../../../shared/domain/enums/day.enum.js'
import {
  ActiveSemesterRef,
  AttendanceRecap,
  ClassroomRef,
  IMyDashboardRepository,
  LatestScoreRow,
  LessonRow,
  ReportCardRef,
  SupervisedClassroom,
  TeachingLoad,
  UngradedAssessmentRow,
} from '../../../domain/repositories/my-dashboard.repository.js'

@Injectable()
export class PrismaMyDashboardRepository extends IMyDashboardRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookupPort: IProfileLookupPort,
    private readonly academicLookup: IAcademicLookupPort,
    private readonly enrollmentLookup: IEnrollmentLookupPort,
  ) {
    super()
  }

  async findActiveSemester(): Promise<ActiveSemesterRef | null> {
    const semester = await this.academicLookup.findActiveSemester()
    if (!semester) return null

    return {
      id: semester.id,
      name: semester.typeName ?? '',
      academicYearId: semester.academicYearId,
    }
  }

  async findEnrolledClassroom(
    studentId: string,
    semesterId: string,
  ): Promise<{ enrollmentId: string; classroom: ClassroomRef } | null> {
    const enrolment = await this.enrollmentLookup.findActiveByStudent(
      studentId,
      semesterId,
    )
    if (!enrolment) return null

    const [classroom] = await this.academicLookup.listClassrooms([
      enrolment.classroomId,
    ])
    if (!classroom) return null

    return {
      enrollmentId: enrolment.id,
      classroom: {
        id: classroom.id,
        code: classroom.code ?? '',
        name: classroom.name,
      },
    }
  }

  async findClassroomLessons(
    classroomId: string,
    day: DayEnum,
  ): Promise<LessonRow[]> {
    return this.lessons({ classroomId }, day, { withEmployeeName: true })
  }

  async findTeachingLessons(
    employeeId: string,
    day: DayEnum,
  ): Promise<LessonRow[]> {
    return this.lessons({ employeeId }, day, { withEmployeeName: false })
  }

  private async lessons(
    scope: { classroomId?: string; employeeId?: string },
    day: DayEnum,
    options: { withEmployeeName: boolean },
  ): Promise<LessonRow[]> {
    const rows = await this.academicLookup.listLessons(scope, day)
    if (rows.length === 0) return []

    const userRefs = options.withEmployeeName
      ? await resolveUserRefs(
          rows
            .map((row) => row.employeeUserId)
            .filter((userId): userId is string => userId !== null),
          this.profileLookupPort,
        )
      : null

    return rows.map((row) => ({
      id: row.id,
      startTime: row.startTime,
      endTime: row.endTime,
      subjectName: row.subjectName,
      classroomCode: scope.classroomId ? null : row.classroomCode,
      employeeName: row.employeeUserId
        ? (userRefs?.get(row.employeeUserId)?.profile?.name ?? null)
        : null,
      room: row.room,
    }))
  }

  async summariseAttendance(enrollmentId: string): Promise<AttendanceRecap> {
    const grouped = await this.prisma.attendance.groupBy({
      by: ['status'],
      where: { enrollmentId, deletedAt: null },
      _count: { _all: true },
    })

    const recap: AttendanceRecap = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      sick: 0,
    }
    const key = {
      PRESENT: 'present',
      ABSENT: 'absent',
      LATE: 'late',
      EXCUSED: 'excused',
      SICK: 'sick',
    } as const

    for (const row of grouped) {
      recap[key[row.status]] = row._count._all
    }
    return recap
  }

  async findLatestScores(
    enrollmentId: string,
    limit: number,
  ): Promise<LatestScoreRow[]> {
    const rows = await this.prisma.studentScore.findMany({
      where: { enrollmentId, deletedAt: null, score: { not: null } },
      select: {
        id: true,
        score: true,
        assessmentItem: {
          select: {
            name: true,
            maxScore: true,
            teachingAssignmentId: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    })
    if (rows.length === 0) return []

    const assignments = await this.academicLookup.listTeachingAssignments([
      ...new Set(rows.map((row) => row.assessmentItem.teachingAssignmentId)),
    ])
    const subjectByAssignment = new Map(
      assignments.map((assignment) => [assignment.id, assignment.subjectName]),
    )

    return rows.map((row) => ({
      id: row.id,
      subjectName:
        subjectByAssignment.get(row.assessmentItem.teachingAssignmentId) ?? '',
      assessmentName: row.assessmentItem.name,
      score: row.score,
      maxScore: row.assessmentItem.maxScore,
    }))
  }

  async findLatestPublishedReportCard(
    studentId: string,
  ): Promise<ReportCardRef | null> {
    const enrollments = await this.enrollmentLookup.search({ studentId })
    if (enrollments.length === 0) return null

    const card = await this.prisma.reportCard.findFirst({
      where: {
        isPublished: true,
        deletedAt: null,
        enrollmentId: { in: enrollments.map((enrolment) => enrolment.id) },
      },
      select: { id: true, enrollmentId: true },
      orderBy: { updatedAt: 'desc' },
    })
    if (!card) return null

    const enrolment = enrollments.find((row) => row.id === card.enrollmentId)
    if (!enrolment) return { id: card.id, semesterName: '' }

    const [semester] = await this.academicLookup.listSemesters([
      enrolment.semesterId,
    ])

    return { id: card.id, semesterName: semester?.typeName ?? '' }
  }

  async summariseTeachingLoad(
    employeeId: string,
    semesterId: string,
  ): Promise<TeachingLoad> {
    return this.academicLookup.summariseTeachingLoad(employeeId, semesterId)
  }

  async findSupervisedClassrooms(
    employeeId: string,
    semesterId: string,
  ): Promise<SupervisedClassroom[]> {
    const classrooms = await this.academicLookup.listSupervisedClassrooms(
      employeeId,
      semesterId,
    )
    if (classrooms.length === 0) return []

    const counts = await this.enrollmentLookup.countByClassrooms(
      classrooms.map((classroom) => classroom.id),
      semesterId,
    )
    const countByClassroom = new Map(
      counts.map((row) => [row.classroomId, row.count]),
    )

    return classrooms.map((classroom) => ({
      id: classroom.id,
      code: classroom.code,
      name: classroom.name,
      studentCount: countByClassroom.get(classroom.id) ?? 0,
    }))
  }

  async findUngradedAssessments(
    employeeId: string,
    semesterId: string,
    limit: number,
  ): Promise<{ rows: UngradedAssessmentRow[]; total: number }> {
    const assignments =
      await this.academicLookup.listTeachingAssignmentsByEmployee(
        employeeId,
        semesterId,
      )
    if (assignments.length === 0) return { rows: [], total: 0 }

    const items = await this.prisma.assessmentItem.findMany({
      where: {
        deletedAt: null,
        teachingAssignmentId: {
          in: assignments.map((assignment) => assignment.id),
        },
      },
      select: {
        id: true,
        name: true,
        teachingAssignmentId: true,
        _count: {
          select: {
            studentScores: { where: { deletedAt: null, score: { not: null } } },
          },
        },
      },
      orderBy: { name: 'asc' },
    })
    if (items.length === 0) return { rows: [], total: 0 }

    const assignmentById = new Map(
      assignments.map((assignment) => [assignment.id, assignment]),
    )
    const counts = await this.enrollmentLookup.countByClassrooms(
      [...new Set(assignments.map((assignment) => assignment.classroomId))],
      semesterId,
    )
    const sizeOf = new Map(counts.map((row) => [row.classroomId, row.count]))

    const outstanding = items
      .flatMap<UngradedAssessmentRow>((item) => {
        const assignment = assignmentById.get(item.teachingAssignmentId)
        if (!assignment) return []

        return [
          {
            id: item.id,
            name: item.name,
            subjectName: assignment.subjectName,
            classroomCode: assignment.classroomCode,
            gradedCount: item._count.studentScores,
            studentCount: sizeOf.get(assignment.classroomId) ?? 0,
          },
        ]
      })
      .filter(
        (row) => row.studentCount > 0 && row.gradedCount < row.studentCount,
      )

    return { rows: outstanding.slice(0, limit), total: outstanding.length }
  }
}
