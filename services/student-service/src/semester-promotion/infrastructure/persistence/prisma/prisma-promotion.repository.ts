import { Injectable } from '@nestjs/common'
import { EnrollmentStatus, StudentStatus } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { resolveUserRefs } from '../../../../shared/utils/resolve-user-refs.helper.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import {
  ClassroomDetail,
  IAcademicLookupPort,
  SemesterContext,
} from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { IReportCardLookupPort } from '../../../../platform/report-card-lookup/report-card-lookup.port.js'
import {
  ActiveEnrollmentWithDetails,
  ClassroomWithGrade,
  SemesterWithAcademicYear,
} from '../../../domain/entities/promotion.entity.js'
import {
  IPromotionRepository,
  PromotionResult,
  StudentPromotionInput,
} from '../../../domain/repositories/promotion.repository.js'
import { moveStudentToTargetSemester } from './prisma-promotion.steps.js'

const PROMOTION_TX_OPTIONS = { maxWait: 10000, timeout: 60000 }

@Injectable()
export class PrismaPromotionRepository extends IPromotionRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookupPort: IProfileLookupPort,
    private readonly academicLookup: IAcademicLookupPort,
    private readonly reportCardLookup: IReportCardLookupPort,
  ) {
    super()
  }

  async findSemesterWithAcademicYear(
    id: string,
  ): Promise<SemesterWithAcademicYear | null> {
    const semester = await this.academicLookup.findSemesterContext(id)
    return semester ? toSemesterWithYear(semester) : null
  }

  async findEdgeSemesterOfAcademicYear(
    academicYearId: string,
    edge: 'first' | 'last',
  ): Promise<SemesterWithAcademicYear | null> {
    const semesters =
      await this.academicLookup.listSemestersByAcademicYear(academicYearId)
    if (semesters.length === 0) return null

    const picked =
      edge === 'last' ? semesters[0] : semesters[semesters.length - 1]
    return toSemesterWithYear(picked)
  }

  async findLatestEnrolledSemesterOfAcademicYear(
    academicYearId: string,
  ): Promise<SemesterWithAcademicYear | null> {
    const semesters =
      await this.academicLookup.listSemestersByAcademicYear(academicYearId)
    if (semesters.length === 0) return null

    const enrolled = await this.prisma.studentEnrollment.findMany({
      where: {
        semesterId: { in: semesters.map((semester) => semester.id) },
        status: EnrollmentStatus.ACTIVE,
        deletedAt: null,
      },
      select: { semesterId: true },
      distinct: ['semesterId'],
    })
    const withEnrolments = new Set(enrolled.map((row) => row.semesterId))

    const latest = semesters.find((semester) => withEnrolments.has(semester.id))
    return latest ? toSemesterWithYear(latest) : null
  }

  async findAcademicYearName(id: string): Promise<string | null> {
    const year = await this.academicLookup.findAcademicYear(id)
    return year?.name ?? null
  }

  async findClassroomById(id: string): Promise<ClassroomWithGrade | null> {
    const classroom = await this.academicLookup.findClassroomDetail(id)
    return classroom ? toClassroomWithGrade(classroom) : null
  }

  async findActiveEnrollmentsWithDetails(
    semesterId: string,
  ): Promise<ActiveEnrollmentWithDetails[]> {
    const rows = await this.prisma.studentEnrollment.findMany({
      where: {
        semesterId,
        status: EnrollmentStatus.ACTIVE,
        deletedAt: null,
        student: { status: StudentStatus.ACTIVE, deletedAt: null },
      },
      select: {
        id: true,
        studentId: true,
        classroomId: true,
        student: { select: { id: true, nis: true, userId: true } },
      },
    })
    if (rows.length === 0) return []

    const semester = await this.academicLookup.findSemesterContext(semesterId)
    if (!semester) return []

    const [userRefs, classrooms, averages] = await Promise.all([
      resolveUserRefs(
        rows.map((row) => row.student.userId),
        this.profileLookupPort,
      ),
      this.academicLookup.listClassroomsByAcademicYear(semester.academicYearId),
      this.reportCardLookup.findAveragesByEnrollmentIds(
        rows.map((row) => row.id),
      ),
    ])

    const classroomById = new Map(
      classrooms.map((classroom) => [classroom.id, classroom]),
    )
    const averageByEnrollment = new Map(
      averages.map((row) => [row.enrollmentId, row.totalAverage]),
    )

    const detailed = rows.flatMap<ActiveEnrollmentWithDetails>((row) => {
      const classroom = classroomById.get(row.classroomId)
      if (!classroom) return []

      return [
        {
          id: row.id,
          studentId: row.studentId,
          classroomId: row.classroomId,
          semesterId,
          student: {
            id: row.student.id,
            nis: row.student.nis,
            user: userRefs.get(row.student.userId),
          },
          classroom: {
            id: classroom.id,
            code: classroom.code,
            grade: {
              level: classroom.gradeLevel ?? 0,
              name: classroom.gradeName ?? '',
            },
          },
          reportCard: { totalAverage: averageByEnrollment.get(row.id) ?? null },
        },
      ]
    })

    detailed.sort((a, b) => {
      const gradeDiff = a.classroom.grade.level - b.classroom.grade.level
      if (gradeDiff !== 0) return gradeDiff
      const codeDiff = a.classroom.code.localeCompare(b.classroom.code)
      if (codeDiff !== 0) return codeDiff
      return (a.student.user?.profile?.name ?? '').localeCompare(
        b.student.user?.profile?.name ?? '',
      )
    })

    return detailed
  }

  async findClassesByAcademicYear(
    academicYearId: string,
  ): Promise<ClassroomWithGrade[]> {
    const classrooms =
      await this.academicLookup.listClassroomsByAcademicYear(academicYearId)
    return classrooms.map(toClassroomWithGrade)
  }

  async executePromotion(
    sourceSemesterId: string,
    targetSemesterId: string,
    students: StudentPromotionInput[],
  ): Promise<PromotionResult> {
    const gradeIdByClassroom = await this.resolveTargetGrades(targetSemesterId)

    return this.prisma.$transaction(async (tx) => {
      const result: PromotionResult = { promoted: 0, repeated: 0, skipped: 0 }

      for (const student of students) {
        const enrollment = await tx.studentEnrollment.findFirst({
          where: {
            studentId: student.studentId,
            semesterId: sourceSemesterId,
            classroomId: student.sourceClassroomId,
            status: EnrollmentStatus.ACTIVE,
            deletedAt: null,
          },
          select: { id: true, studentId: true },
        })

        if (!enrollment) {
          result.skipped++
          continue
        }

        await moveStudentToTargetSemester(
          tx,
          enrollment,
          student,
          targetSemesterId,
          gradeIdByClassroom,
          result,
        )
      }

      return result
    }, PROMOTION_TX_OPTIONS)
  }

  private async resolveTargetGrades(
    targetSemesterId: string,
  ): Promise<Map<string, string>> {
    const semester =
      await this.academicLookup.findSemesterContext(targetSemesterId)
    if (!semester) return new Map()

    const classrooms = await this.academicLookup.listClassroomsByAcademicYear(
      semester.academicYearId,
    )
    return new Map(
      classrooms.map((classroom) => [classroom.id, classroom.gradeId]),
    )
  }
}

function toSemesterWithYear(
  semester: SemesterContext,
): SemesterWithAcademicYear {
  return {
    id: semester.id,
    academicYearId: semester.academicYearId,
    academicYear: {
      id: semester.academicYearId,
      name: semester.academicYearName ?? '',
    },
  }
}

function toClassroomWithGrade(classroom: ClassroomDetail): ClassroomWithGrade {
  return {
    id: classroom.id,
    name: classroom.name,
    code: classroom.code,
    academicYearId: classroom.academicYearId,
    grade: {
      level: classroom.gradeLevel ?? 0,
      name: classroom.gradeName ?? '',
    },
  }
}
