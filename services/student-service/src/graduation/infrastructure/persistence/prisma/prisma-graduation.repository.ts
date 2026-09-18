import { Injectable, NotFoundException } from '@nestjs/common'
import {
  EnrollmentStatus,
  Prisma,
  StudentGraduation,
  StudentStatus,
} from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import type {
  StudentGraduationQueryInput,
  CreateStudentGraduationRepositoryInput,
  UpdateStudentGraduationRepositoryInput,
} from '../../../domain/repositories/graduation.repository.js'
import { IGraduationRepository } from '../../../domain/repositories/graduation.repository.js'
import type {
  BulkGraduationInput,
  BulkGraduationResult,
  GraduationCandidateList,
  GraduationHoldRecord,
} from '../../../domain/repositories/graduation.repository.js'
import { resolveUserRefs } from '../../../../shared/utils/resolve-user-refs.helper.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { graduateStudentSteps } from './prisma-graduation.steps.js'
import { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import {
  GRADUATION_WITH_DETAILS_INCLUDE,
  GraduationRow,
} from './prisma-graduation.includes.js'

@Injectable()
export class PrismaGraduationRepository extends IGraduationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookupPort: IProfileLookupPort,
    private readonly academicLookup: IAcademicLookupPort,
  ) {
    super()
  }

  private async attachStudentProfiles(rows: GraduationRow[]) {
    const [userRefs, years] = await Promise.all([
      resolveUserRefs(
        rows.map((row) => row.student.userId),
        this.profileLookupPort,
      ),
      this.academicLookup.listAcademicYears([
        ...new Set(rows.map((row) => row.academicYearId)),
      ]),
    ])
    const yearById = new Map(years.map((year) => [year.id, year]))

    return rows.map((row) => ({
      ...row,
      student: { ...row.student, user: userRefs.get(row.student.userId) },
      academicYear: yearById.get(row.academicYearId) ?? null,
    }))
  }

  async findAll(
    query: StudentGraduationQueryInput,
  ): Promise<PaginatedResult<GraduationRow>> {
    const { page = 1, limit = 10, academicYearId, search } = query

    const where: Prisma.StudentGraduationWhereInput = {
      deletedAt: null,
      ...(academicYearId && { academicYearId }),
    }

    const rows = await this.prisma.studentGraduation.findMany({
      where,
      include: GRADUATION_WITH_DETAILS_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })

    const withProfiles = await this.attachStudentProfiles(rows)
    const needle = search?.trim().toLowerCase()
    const filtered = needle
      ? withProfiles.filter((row) => {
          const nisMatch = row.student.nis.toLowerCase().includes(needle)
          const nisnMatch = row.student.nisn.toLowerCase().includes(needle)
          const nameMatch =
            row.student.user?.profile?.name.toLowerCase().includes(needle) ??
            false
          return nisMatch || nisnMatch || nameMatch
        })
      : withProfiles

    const skip = (page - 1) * limit
    return {
      data: filtered.slice(skip, skip + limit),
      total: filtered.length,
      page,
      limit,
    }
  }

  async findById(id: string): Promise<GraduationRow | null> {
    const row = await this.prisma.studentGraduation.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: GRADUATION_WITH_DETAILS_INCLUDE,
    })
    if (!row) return null
    const [withUser] = await this.attachStudentProfiles([row])
    return withUser
  }

  async findByStudentId(studentId: string): Promise<StudentGraduation | null> {
    return this.prisma.studentGraduation.findFirst({
      where: {
        studentId,
        deletedAt: null,
      },
    })
  }

  async create(
    dto: CreateStudentGraduationRepositoryInput,
  ): Promise<GraduationRow> {
    const row = await this.prisma.$transaction(async (tx) => {
      const student = await tx.student.findFirst({
        where: {
          id: dto.studentId,
        },
      })

      if (!student) {
        throw new NotFoundException(`Student ${dto.studentId} not found`)
      }

      const id = await graduateStudentSteps(tx, {
        studentId: dto.studentId,
        academicYearId: dto.academicYearId,
        ...(dto.graduationDate && {
          graduationDate: new Date(dto.graduationDate),
        }),
        ...(dto.certificateNo && { certificateNo: dto.certificateNo }),
        ...(dto.note && { note: dto.note }),
      })

      return tx.studentGraduation.findUniqueOrThrow({
        where: { id },
        include: GRADUATION_WITH_DETAILS_INCLUDE,
      })
    })
    const [withUser] = await this.attachStudentProfiles([row])
    return withUser
  }

  async update(
    id: string,
    dto: UpdateStudentGraduationRepositoryInput,
  ): Promise<GraduationRow> {
    const { studentId, academicYearId, graduationDate, ...rest } = dto
    const row = await this.prisma.studentGraduation.update({
      where: { id },
      data: {
        ...rest,
        ...(studentId && { studentId }),
        ...(academicYearId && { academicYearId }),
        ...(graduationDate && { graduationDate: new Date(graduationDate) }),
      },
      include: GRADUATION_WITH_DETAILS_INCLUDE,
    })
    const [withUser] = await this.attachStudentProfiles([row])
    return withUser
  }

  async remove(id: string): Promise<StudentGraduation> {
    return this.softDelete(id)
  }

  async findCandidates(): Promise<GraduationCandidateList> {
    const academicYear = await this.academicLookup.findActiveAcademicYear()
    if (!academicYear) {
      return { academicYear: null, finalGradeName: null, students: [] }
    }

    const term = { id: academicYear.id, name: academicYear.name }

    const classrooms = await this.academicLookup.listClassroomsByAcademicYear(
      academicYear.id,
    )
    if (classrooms.length === 0) {
      return { academicYear: term, finalGradeName: null, students: [] }
    }

    const finalLevel = Math.max(
      ...classrooms.map((classroom) => classroom.gradeLevel ?? 0),
    )
    const finalClassrooms = classrooms.filter(
      (classroom) => classroom.gradeLevel === finalLevel,
    )
    const finalGradeName = finalClassrooms[0]?.gradeName ?? null
    const classroomById = new Map(
      finalClassrooms.map((classroom) => [classroom.id, classroom]),
    )

    const semesters = await this.academicLookup.listSemestersByAcademicYear(
      academicYear.id,
    )

    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        semesterId: { in: semesters.map((semester) => semester.id) },
        classroomId: { in: [...classroomById.keys()] },
        status: EnrollmentStatus.ACTIVE,
        deletedAt: null,
        student: {
          status: StudentStatus.ACTIVE,
          deletedAt: null,
          graduations: { none: { deletedAt: null } },
        },
      },
      select: {
        studentId: true,
        classroomId: true,
        student: { select: { nis: true, userId: true } },
      },
      orderBy: { student: { nis: 'asc' } },
    })

    const holds = await this.prisma.studentGraduationHold.findMany({
      where: { studentId: { in: enrollments.map((e) => e.studentId) } },
      select: {
        studentId: true,
        academicYearId: true,
        reason: true,
        decidedAt: true,
      },
      orderBy: { decidedAt: 'desc' },
    })

    const latestHold = new Map<string, (typeof holds)[number]>()
    for (const hold of holds) {
      if (!latestHold.has(hold.studentId)) latestHold.set(hold.studentId, hold)
    }

    const [userRefs, holdYears] = await Promise.all([
      resolveUserRefs(
        enrollments.map((e) => e.student.userId),
        this.profileLookupPort,
      ),
      this.academicLookup.listAcademicYears([
        ...new Set([...latestHold.values()].map((hold) => hold.academicYearId)),
      ]),
    ])
    const yearNameById = new Map(holdYears.map((year) => [year.id, year.name]))

    return {
      academicYear: term,
      finalGradeName,
      students: enrollments.flatMap((e) => {
        const classroom = classroomById.get(e.classroomId)
        if (!classroom) return []

        const hold = latestHold.get(e.studentId)
        return [
          {
            studentId: e.studentId,
            studentName: userRefs.get(e.student.userId)?.profile?.name ?? '-',
            nis: e.student.nis,
            classroomId: classroom.id,
            classroomName: classroom.code,
            gradeName: classroom.gradeName ?? '',
            ...(hold && {
              previousHold: {
                academicYearId: hold.academicYearId,
                academicYearName: yearNameById.get(hold.academicYearId) ?? '',
                reason: hold.reason,
                decidedAt: hold.decidedAt,
              },
            }),
          },
        ]
      }),
    }
  }

  async findHolds(academicYearId?: string): Promise<GraduationHoldRecord[]> {
    const holds = await this.prisma.studentGraduationHold.findMany({
      where: { ...(academicYearId && { academicYearId }) },
      select: {
        id: true,
        studentId: true,
        academicYearId: true,
        reason: true,
        decidedAt: true,
        student: {
          select: { nis: true, userId: true },
        },
      },
      orderBy: [{ decidedAt: 'desc' }, { student: { nis: 'asc' } }],
    })

    const [userRefs, years] = await Promise.all([
      resolveUserRefs(
        holds.map((hold) => hold.student.userId),
        this.profileLookupPort,
      ),
      this.academicLookup.listAcademicYears([
        ...new Set(holds.map((hold) => hold.academicYearId)),
      ]),
    ])
    const yearNameById = new Map(years.map((year) => [year.id, year.name]))

    return holds.map((hold) => ({
      id: hold.id,
      studentId: hold.studentId,
      studentName: userRefs.get(hold.student.userId)?.profile?.name ?? '-',
      nis: hold.student.nis,
      academicYearId: hold.academicYearId,
      academicYearName: yearNameById.get(hold.academicYearId) ?? '',
      reason: hold.reason,
      decidedAt: hold.decidedAt,
    }))
  }

  async findActiveAcademicYearId(): Promise<string | null> {
    const year = await this.academicLookup.findActiveAcademicYear()
    return year?.id ?? null
  }

  async executeBulk(input: BulkGraduationInput): Promise<BulkGraduationResult> {
    return this.prisma.$transaction(async (tx) => {
      const result: BulkGraduationResult = {
        graduated: 0,
        skipped: 0,
        held: 0,
      }

      for (const student of input.students) {
        const existing = await tx.studentGraduation.findFirst({
          where: { studentId: student.studentId, deletedAt: null },
          select: { id: true },
        })
        if (existing) {
          result.skipped++
          continue
        }

        await graduateStudentSteps(tx, {
          studentId: student.studentId,
          academicYearId: input.academicYearId,
          ...(input.graduationDate && {
            graduationDate: input.graduationDate,
          }),
          ...(student.certificateNo && {
            certificateNo: student.certificateNo,
          }),
          ...(student.note && { note: student.note }),
        })
        result.graduated++
      }

      for (const hold of input.held ?? []) {
        await tx.studentGraduationHold.upsert({
          where: {
            studentId_academicYearId: {
              studentId: hold.studentId,
              academicYearId: input.academicYearId,
            },
          },
          create: {
            studentId: hold.studentId,
            academicYearId: input.academicYearId,
            reason: hold.reason,
          },
          update: { reason: hold.reason, decidedAt: new Date() },
          select: { id: true },
        })
        result.held++
      }

      return result
    })
  }

  async softDelete(id: string): Promise<StudentGraduation> {
    return this.prisma.studentGraduation.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}
