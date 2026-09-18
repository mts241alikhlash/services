import { Injectable } from '@nestjs/common'
import { AssessmentType, Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { resolveUserRefs } from '../../../../shared/utils/resolve-user-refs.helper.js'
import { resolveAssessmentRefs } from '../../../../shared/utils/assessment-refs.helper.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import type {
  StudentScoreQueryInput,
  CreateStudentScoreRepositoryInput,
  UpdateStudentScoreRepositoryInput,
  BulkStudentScoreRecord,
} from '../../../domain/repositories/student-score.repository.js'
import {
  IStudentScoreRepository,
  ReportCardScoreRow,
  StudentScoreRosterItem,
} from '../../../domain/repositories/student-score.repository.js'
import { StudentScoreWithDetails } from '../../../domain/entities/student-score.entity.js'
import { toAssignmentRef, toEnrollmentRef } from './prisma-assessment.refs.js'
import {
  STUDENT_SCORE_WITH_DETAILS_INCLUDE as STUDENT_SCORE_INCLUDE,
  StudentScoreRow,
} from './prisma-assessment.includes.js'
import {
  buildScoreRoster,
  upsertScores,
} from './prisma-student-score.roster.js'

@Injectable()
export class PrismaStudentScoreRepository extends IStudentScoreRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookupPort: IProfileLookupPort,
    private readonly academicLookup: IAcademicLookupPort,
    private readonly enrollmentLookup: IEnrollmentLookupPort,
  ) {
    super()
  }

  private async decorate(
    rows: StudentScoreRow[],
  ): Promise<StudentScoreWithDetails[]> {
    if (rows.length === 0) return []

    const refs = await resolveAssessmentRefs(
      this.enrollmentLookup,
      this.academicLookup,
      {
        enrollmentIds: rows.map((row) => row.enrollmentId),
        teachingAssignmentIds: rows.map(
          (row) => row.assessmentItem.teachingAssignmentId,
        ),
      },
    )

    const employeeUserIds = rows
      .map((row) => refs.assignment(row.assessmentItem.teachingAssignmentId))
      .filter((assignment) => assignment !== null)
      .map((assignment) => assignment.employeeUserId)
      .filter((userId): userId is string => userId !== null)

    const userRefs = await resolveUserRefs(
      employeeUserIds,
      this.profileLookupPort,
    )

    return rows.map((row) => {
      const assignment = refs.assignment(
        row.assessmentItem.teachingAssignmentId,
      )
      const enrolment = refs.enrollment(row.enrollmentId)

      return {
        ...row,
        assessmentItem: {
          ...row.assessmentItem,
          teachingAssignment: assignment
            ? toAssignmentRef(assignment, userRefs)
            : undefined,
        },
        enrollment: enrolment ? toEnrollmentRef(enrolment) : undefined,
      }
    })
  }

  async findAll(query: StudentScoreQueryInput) {
    const {
      page = 1,
      limit = 10,
      enrollmentId,
      assessmentItemId,
      classroomId,
      semesterId,
      studentId,
    } = query
    const skip = (page - 1) * limit

    const scoped = Boolean(classroomId ?? semesterId ?? studentId)
    const scopedEnrollmentIds = scoped
      ? (
          await this.enrollmentLookup.search({
            classroomId,
            semesterId,
            studentId,
          })
        ).map((enrolment) => enrolment.id)
      : null

    const where: Prisma.StudentScoreWhereInput = {
      deletedAt: null,
      ...(assessmentItemId && { assessmentItemId }),
      ...buildEnrollmentFilter(enrollmentId, scopedEnrollmentIds),
    }
    const [rows, total] = await Promise.all([
      this.prisma.studentScore.findMany({
        where,
        skip,
        take: limit,
        include: STUDENT_SCORE_INCLUDE,
      }),
      this.prisma.studentScore.count({ where }),
    ])
    return { data: await this.decorate(rows), total, page, limit }
  }

  async findById(id: string) {
    const row = await this.prisma.studentScore.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: STUDENT_SCORE_INCLUDE,
    })
    if (!row) return null
    const [withRefs] = await this.decorate([row])
    return withRefs
  }

  async findScore(
    assessmentItemId: string,
    studentEnrollmentId: string,
    excludeId?: string,
  ) {
    return this.prisma.studentScore.findFirst({
      where: {
        assessmentItemId,
        enrollmentId: studentEnrollmentId,
        deletedAt: null,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    })
  }

  async findAllForReportCard(
    enrollmentId: string,
  ): Promise<ReportCardScoreRow[]> {
    const rows = await this.prisma.studentScore.findMany({
      where: { enrollmentId, deletedAt: null },
      include: STUDENT_SCORE_INCLUDE,
    })
    if (rows.length === 0) return []

    const assignmentIds = [
      ...new Set(rows.map((row) => row.assessmentItem.teachingAssignmentId)),
    ]
    const [assignments, weights] = await Promise.all([
      this.academicLookup.listTeachingAssignments(assignmentIds),
      this.prisma.assessmentWeight.findMany({
        where: { teachingAssignmentId: { in: assignmentIds } },
        select: { teachingAssignmentId: true, type: true, weight: true },
      }),
    ])

    const assignmentById = new Map(
      assignments.map((assignment) => [assignment.id, assignment]),
    )
    const weightsByAssignment = new Map<
      string,
      { type: AssessmentType; weight: number }[]
    >()
    for (const row of weights) {
      const list = weightsByAssignment.get(row.teachingAssignmentId) ?? []
      list.push({ type: row.type, weight: row.weight })
      weightsByAssignment.set(row.teachingAssignmentId, list)
    }

    return rows.flatMap<ReportCardScoreRow>((row) => {
      const assignment = assignmentById.get(
        row.assessmentItem.teachingAssignmentId,
      )
      if (!assignment) return []

      return [
        {
          id: row.id,
          enrollmentId: row.enrollmentId,
          assessmentItemId: row.assessmentItemId,
          score: row.score,
          note: row.note,
          assessmentItem: {
            id: row.assessmentItem.id,
            name: row.assessmentItem.name,
            type: row.assessmentItem.type,
            weight: row.assessmentItem.weight,
            maxScore: row.assessmentItem.maxScore,
            teachingAssignment: {
              id: assignment.id,
              passingScore: assignment.passingScore,
              subject: {
                id: assignment.subjectId,
                name: assignment.subjectName,
                code: assignment.subjectCode,
              },
              classroom: {
                gradeId: assignment.classroomGradeId,
                academicYearId: assignment.classroomAcademicYearId,
              },
              assessmentWeights: weightsByAssignment.get(assignment.id) ?? [],
            },
          },
        },
      ]
    })
  }

  async findDuplicate(
    enrollmentId: string,
    assessmentItemId: string,
    excludeId?: string,
  ) {
    return this.prisma.studentScore.findFirst({
      where: {
        enrollmentId,
        assessmentItemId,
        deletedAt: null,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    })
  }

  async create(data: CreateStudentScoreRepositoryInput) {
    const row = await this.prisma.studentScore.create({
      data,
      include: STUDENT_SCORE_INCLUDE,
    })
    const [withRefs] = await this.decorate([row])
    return withRefs
  }

  async update(id: string, data: UpdateStudentScoreRepositoryInput) {
    const row = await this.prisma.studentScore.update({
      where: { id },
      data,
      include: STUDENT_SCORE_INCLUDE,
    })
    const [withRefs] = await this.decorate([row])
    return withRefs
  }

  async findSoftDeleted(enrollmentId: string, assessmentItemId: string) {
    return this.prisma.studentScore.findFirst({
      where: {
        enrollmentId,
        assessmentItemId,
        deletedAt: { not: null },
      },
    })
  }

  async restore(id: string, data?: UpdateStudentScoreRepositoryInput) {
    return this.prisma.studentScore.update({
      where: { id },
      data: { ...(data ?? {}), deletedAt: null },
      include: STUDENT_SCORE_INCLUDE,
    })
  }

  async remove(id: string) {
    return this.softDelete(id)
  }

  async softDelete(id: string) {
    return this.prisma.studentScore.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async getRoster(
    assessmentItemId: string,
    classroomId?: string,
    semesterId?: string,
  ): Promise<StudentScoreRosterItem[]> {
    return buildScoreRoster(
      this.prisma,
      this.enrollmentLookup,
      assessmentItemId,
      classroomId,
      semesterId,
    )
  }

  async bulkUpsert(
    assessmentItemId: string,
    records: BulkStudentScoreRecord[],
    correctedById: string | null = null,
  ) {
    return upsertScores(this.prisma, assessmentItemId, records, correctedById)
  }
}

function buildEnrollmentFilter(
  enrollmentId: string | undefined,
  scopedEnrollmentIds: string[] | null,
): Prisma.StudentScoreWhereInput {
  if (scopedEnrollmentIds === null) {
    return enrollmentId ? { enrollmentId } : {}
  }
  if (!enrollmentId) return { enrollmentId: { in: scopedEnrollmentIds } }
  return scopedEnrollmentIds.includes(enrollmentId)
    ? { enrollmentId }
    : { enrollmentId: { in: [] } }
}
