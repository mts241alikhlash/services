import { Injectable } from '@nestjs/common'
import { EnrollmentStatus, Prisma, StudentEnrollment } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import type {
  StudentEnrollmentQueryInput,
  UpdateEnrollmentRepositoryInput,
} from '../../../domain/repositories/enrollment.repository.js'
import { resolveUserRefs } from '../../../../shared/utils/resolve-user-refs.helper.js'
import {
  UserRef,
  ProfileRosterRef,
} from '../../../../shared/domain/entities/reference.entity.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import {
  EnrollmentClassroomRef,
  EnrollmentSemesterRef,
} from '../../../domain/entities/enrollment.entity.js'
import { IEnrollmentRepository } from '../../../domain/repositories/enrollment.repository.js'
import {
  ENROLLMENT_WITH_DETAILS_INCLUDE,
  EnrollmentRow,
} from './prisma-enrollment.includes.js'
import {
  buildEnrollmentListWhere,
  countActiveByClassroomSemester,
  countActiveByClassroomIds,
  countActiveByIds,
  countBySemesterIds,
  findActiveEnrollment,
  findDuplicateEnrollment,
  findManyActiveByIds,
  findSoftDeletedEnrollment,
} from './prisma-enrollment.queries.js'
import {
  BulkEnrollmentRow,
  createManyEnrollments,
} from './prisma-enrollment.bulk.js'
import { resolveAcademicRefs } from './prisma-enrollment.refs.js'
import { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'

type EnrollmentRowWithRefs = Omit<EnrollmentRow, 'student'> & {
  student: EnrollmentRow['student'] & { user?: UserRef<ProfileRosterRef> }
  classroom?: EnrollmentClassroomRef
  semester?: EnrollmentSemesterRef
}

@Injectable()
export class PrismaEnrollmentRepository extends IEnrollmentRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookupPort: IProfileLookupPort,
    private readonly academicLookup: IAcademicLookupPort,
  ) {
    super()
  }

  private async decorate(
    rows: EnrollmentRow[],
  ): Promise<EnrollmentRowWithRefs[]> {
    if (rows.length === 0) return []

    const [userRefs, academic] = await Promise.all([
      resolveUserRefs(
        rows.map((row) => row.student.userId),
        this.profileLookupPort,
      ),
      resolveAcademicRefs(this.academicLookup, rows),
    ])

    return rows.map((row) => ({
      ...row,
      student: { ...row.student, user: userRefs.get(row.student.userId) },
      classroom: academic.classroomById.get(row.classroomId),
      semester: academic.semesterById.get(row.semesterId),
    }))
  }

  async findAll(
    query: StudentEnrollmentQueryInput,
  ): Promise<PaginatedResult<EnrollmentRowWithRefs>> {
    const {
      page = 1,
      limit = 10,
      semesterId,
      academicYearId,
      studentId,
    } = query

    const scoped = Boolean(academicYearId ?? studentId)
    const [resolvedSemesterId, academicYearSemesterIds] = await Promise.all([
      semesterId ??
        (scoped
          ? undefined
          : this.academicLookup
              .findActiveSemester()
              .then((semester) => semester?.id)),
      academicYearId
        ? this.academicLookup
            .listSemestersByAcademicYear(academicYearId)
            .then((semesters) => semesters.map((semester) => semester.id))
        : null,
    ])

    const where = buildEnrollmentListWhere(
      query,
      resolvedSemesterId,
      academicYearSemesterIds,
    )

    const [data, total] = await Promise.all([
      this.prisma.studentEnrollment.findMany({
        where,
        include: ENROLLMENT_WITH_DETAILS_INCLUDE,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { enrolledAt: 'desc' },
      }),
      this.prisma.studentEnrollment.count({ where }),
    ])

    return { data: await this.decorate(data), total, page, limit }
  }

  async findById(id: string): Promise<EnrollmentRowWithRefs | null> {
    const row = await this.prisma.studentEnrollment.findFirst({
      where: { id, deletedAt: null },
      include: ENROLLMENT_WITH_DETAILS_INCLUDE,
    })
    if (!row) return null
    const [withRefs] = await this.decorate([row])
    return withRefs
  }

  async countActiveByClassroomAndSemester(
    classroomId: string,
    semesterId: string,
  ) {
    return countActiveByClassroomSemester(this.prisma, classroomId, semesterId)
  }

  async rolloverToSemester(
    sourceSemesterId: string,
    targetSemesterId: string,
    classroomIdMap: Map<string, string>,
  ): Promise<{ created: number; skipped: number }> {
    const source = await this.prisma.studentEnrollment.findMany({
      where: {
        semesterId: sourceSemesterId,
        status: EnrollmentStatus.ACTIVE,
        deletedAt: null,
      },
      select: { studentId: true, classroomId: true },
    })

    let created = 0
    let skipped = 0

    await this.prisma.$transaction(
      async (tx) => {
        for (const enrolment of source) {
          const newClassroomId = classroomIdMap.get(enrolment.classroomId)
          if (!newClassroomId) continue

          const existing = await tx.studentEnrollment.findFirst({
            where: {
              studentId: enrolment.studentId,
              semesterId: targetSemesterId,
              deletedAt: null,
            },
            select: { id: true },
          })

          if (existing) {
            skipped++
            continue
          }

          await tx.studentEnrollment.create({
            data: {
              studentId: enrolment.studentId,
              classroomId: newClassroomId,
              semesterId: targetSemesterId,
              status: EnrollmentStatus.ACTIVE,
            },
          })
          created++
        }
      },
      { maxWait: 10000, timeout: 30000 },
    )

    return { created, skipped }
  }

  async countByClassroom(classroomId: string): Promise<number> {
    return this.prisma.studentEnrollment.count({
      where: { classroomId, deletedAt: null },
    })
  }

  async countActiveByClassrooms(
    classroomIds: string[],
    semesterId: string,
  ): Promise<{ classroomId: string; count: number }[]> {
    return countActiveByClassroomIds(this.prisma, classroomIds, semesterId)
  }

  async countBySemesters(
    semesterIds: string[],
  ): Promise<{ semesterId: string; count: number }[]> {
    return countBySemesterIds(this.prisma, semesterIds)
  }

  async countBySemester(semesterId: string): Promise<number> {
    return this.prisma.studentEnrollment.count({
      where: { semesterId, deletedAt: null },
    })
  }

  async countActiveByIds(ids: string[]) {
    return countActiveByIds(this.prisma, ids)
  }

  async findManyActiveByIds(ids: string[]): Promise<EnrollmentRowWithRefs[]> {
    return this.decorate(await findManyActiveByIds(this.prisma, ids))
  }

  async findActiveEnrollment(
    studentId: string,
    semesterId?: string,
    excludeId?: string,
  ): Promise<EnrollmentRowWithRefs | null> {
    const row = await findActiveEnrollment(
      this.prisma,
      studentId,
      semesterId,
      excludeId,
    )
    if (!row) return null
    const [withRefs] = await this.decorate([row])
    return withRefs
  }

  async findDuplicate(
    studentId: string,
    semesterId?: string,
    excludeId?: string,
  ) {
    return findDuplicateEnrollment(
      this.prisma,
      studentId,
      semesterId,
      excludeId,
    )
  }

  async findSoftDeleted(studentId: string, semesterId: string) {
    return findSoftDeletedEnrollment(this.prisma, studentId, semesterId)
  }

  async create(data: BulkEnrollmentRow): Promise<EnrollmentRowWithRefs> {
    const row = await this.prisma.studentEnrollment.create({
      data: {
        studentId: data.studentId,
        classroomId: data.classroomId,
        semesterId: data.semesterId,
        status: data.status ?? undefined,
      },
      include: ENROLLMENT_WITH_DETAILS_INCLUDE,
    })
    const [withRefs] = await this.decorate([row])
    return withRefs
  }

  async update(
    id: string,
    data: UpdateEnrollmentRepositoryInput,
  ): Promise<EnrollmentRowWithRefs> {
    const row = await this.prisma.studentEnrollment.update({
      where: { id },
      data,
      include: ENROLLMENT_WITH_DETAILS_INCLUDE,
    })
    const [withRefs] = await this.decorate([row])
    return withRefs
  }

  async restore(
    id: string,
    data: { classroomId: string },
  ): Promise<EnrollmentRowWithRefs> {
    const row = await this.prisma.studentEnrollment.update({
      where: { id },
      data: { ...data, deletedAt: null, status: EnrollmentStatus.ACTIVE },
      include: ENROLLMENT_WITH_DETAILS_INCLUDE,
    })
    const [withRefs] = await this.decorate([row])
    return withRefs
  }

  async softDelete(id: string): Promise<StudentEnrollment> {
    return this.prisma.studentEnrollment.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async remove(id: string): Promise<StudentEnrollment> {
    return this.softDelete(id)
  }

  async createMany(rows: BulkEnrollmentRow[]): Promise<Prisma.BatchPayload> {
    return createManyEnrollments(this.prisma, rows)
  }
}
