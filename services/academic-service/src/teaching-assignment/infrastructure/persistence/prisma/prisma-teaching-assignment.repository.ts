import { Injectable } from '@nestjs/common'
import { Prisma, TeachingAssignment } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { resolveSemesterId } from '../../../../shared/utils/active-academic-year.helper.js'
import {
  EmployeePersonRef,
  resolveEmployeeRefs,
} from '../../../../shared/utils/resolve-person-refs.helper.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import { IEmployeeLookupPort } from '../../../../platform/employee-lookup/employee-lookup.port.js'
import {
  ITeachingAssignmentRepository,
  ClassroomReference,
  SemesterReference,
  CreateTeachingAssignmentRepositoryInput,
  UpdateTeachingAssignmentRepositoryInput,
  RestoreTeachingAssignmentRepositoryInput,
  TeachingAssignmentDetailRow,
  TeachingAssignmentRepositoryQueryInput,
  TeachingAssignmentWithDetails,
  TeachingLoadSummary,
} from '../../../domain/repositories/teaching-assignment.repository.js'
import { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import {
  TEACHING_ASSIGNMENT_WITH_DETAILS_INCLUDE,
  TeachingAssignmentRow,
} from './prisma-teaching-assignment.includes.js'

type TeachingAssignmentRowWithEmployee = TeachingAssignmentRow & {
  employee?: EmployeePersonRef
}

@Injectable()
export class PrismaTeachingAssignmentRepository extends ITeachingAssignmentRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileLookupPort: IProfileLookupPort,
    private readonly employeeLookup: IEmployeeLookupPort,
  ) {
    super()
  }

  private async attachEmployeeProfiles(
    rows: TeachingAssignmentRow[],
  ): Promise<TeachingAssignmentRowWithEmployee[]> {
    if (rows.length === 0) return []

    const employees = await resolveEmployeeRefs(
      rows.map((row) => row.employeeId),
      this.employeeLookup,
      this.profileLookupPort,
    )

    return rows.map((row) => ({
      ...row,
      employee: employees.get(row.employeeId),
    }))
  }

  async findAll(
    query: TeachingAssignmentRepositoryQueryInput,
  ): Promise<PaginatedResult<TeachingAssignmentWithDetails>> {
    const {
      page = 1,
      limit = 10,
      employeeId,
      classroomId,
      subjectId,
      semesterId,
    } = query
    const skip = (page - 1) * limit

    const resolvedSemesterId = await resolveSemesterId(this.prisma, semesterId)

    const where: Prisma.TeachingAssignmentWhereInput = {
      deletedAt: null,
      ...(employeeId && { employeeId }),
      ...(classroomId && { classroomId }),
      ...(subjectId && { subjectId }),
      ...(resolvedSemesterId && { semesterId: resolvedSemesterId }),
    }

    const [rows, total] = await Promise.all([
      this.prisma.teachingAssignment.findMany({
        where,
        include: TEACHING_ASSIGNMENT_WITH_DETAILS_INCLUDE,
        skip,
        take: limit,
        orderBy: { classroom: { name: 'asc' } },
      }),
      this.prisma.teachingAssignment.count({ where }),
    ])
    const data = await this.attachEmployeeProfiles(rows)
    return { data, total, page, limit }
  }

  async findDetailsByIds(
    ids: string[],
  ): Promise<TeachingAssignmentDetailRow[]> {
    if (ids.length === 0) return []
    return this.findDetails({ id: { in: ids } })
  }

  async findDetailsByEmployee(
    employeeId: string,
    semesterId: string,
  ): Promise<TeachingAssignmentDetailRow[]> {
    return this.findDetails({ employeeId, semesterId })
  }

  private async findDetails(
    where: Prisma.TeachingAssignmentWhereInput,
  ): Promise<TeachingAssignmentDetailRow[]> {
    const rows = await this.prisma.teachingAssignment.findMany({
      where: { ...where, deletedAt: null },
      select: {
        id: true,
        employeeId: true,
        classroomId: true,
        subjectId: true,
        semesterId: true,
        passingScore: true,
        subject: { select: { code: true, name: true } },
        classroom: {
          select: {
            code: true,
            name: true,
            gradeId: true,
            academicYearId: true,
          },
        },
      },
    })
    if (rows.length === 0) return []

    const employees = await this.employeeLookup.listByIds(
      rows.map((row) => row.employeeId),
    )
    const userIdByEmployee = new Map(
      employees.map((employee) => [employee.id, employee.userId]),
    )

    return rows.map((row) => ({
      id: row.id,
      employeeId: row.employeeId,
      classroomId: row.classroomId,
      subjectId: row.subjectId,
      semesterId: row.semesterId,
      subjectCode: row.subject.code,
      subjectName: row.subject.name,
      classroomCode: row.classroom.code,
      classroomName: row.classroom.name,
      classroomGradeId: row.classroom.gradeId,
      classroomAcademicYearId: row.classroom.academicYearId,
      passingScore: row.passingScore,
      employeeUserId: userIdByEmployee.get(row.employeeId) ?? null,
    }))
  }

  async listEmployeeIdsForAcademicYear(
    academicYearId: string,
  ): Promise<string[]> {
    const semester = { academicYearId, deletedAt: null }

    const [assignments, supervisors] = await Promise.all([
      this.prisma.teachingAssignment.findMany({
        where: { deletedAt: null, semester },
        select: { employeeId: true },
        distinct: ['employeeId'],
      }),
      this.prisma.classroomSupervisor.findMany({
        where: { deletedAt: null, semester },
        select: { employeeId: true },
        distinct: ['employeeId'],
      }),
    ])

    return [
      ...new Set([
        ...assignments.map((row) => row.employeeId),
        ...supervisors.map((row) => row.employeeId),
      ]),
    ]
  }

  async existsForEmployee(id: string, employeeId: string): Promise<boolean> {
    const found = await this.prisma.teachingAssignment.findFirst({
      where: { id, employeeId, deletedAt: null },
      select: { id: true },
    })
    return found !== null
  }

  async summariseLoad(
    employeeId: string,
    semesterId: string,
  ): Promise<TeachingLoadSummary> {
    const rows = await this.prisma.teachingAssignment.findMany({
      where: { employeeId, semesterId, deletedAt: null },
      select: { classroomId: true, subjectId: true },
    })

    return {
      classroomCount: new Set(rows.map((row) => row.classroomId)).size,
      subjectCount: new Set(rows.map((row) => row.subjectId)).size,
    }
  }

  async findById(id: string): Promise<TeachingAssignmentWithDetails | null> {
    const row = await this.prisma.teachingAssignment.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: TEACHING_ASSIGNMENT_WITH_DETAILS_INCLUDE,
    })
    if (!row) return null
    const [withUser] = await this.attachEmployeeProfiles([row])
    return withUser
  }

  async findDuplicate(
    employeeId: string,
    classroomId: string,
    subjectId: string,
    semesterId: string,
    excludeId?: string,
  ): Promise<TeachingAssignment | null> {
    return this.prisma.teachingAssignment.findFirst({
      where: {
        employeeId,
        classroomId,
        subjectId,
        semesterId,
        deletedAt: null,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    })
  }

  async create(
    data: CreateTeachingAssignmentRepositoryInput,
  ): Promise<TeachingAssignmentWithDetails> {
    const row = await this.prisma.teachingAssignment.create({
      data,
      include: TEACHING_ASSIGNMENT_WITH_DETAILS_INCLUDE,
    })
    const [withUser] = await this.attachEmployeeProfiles([row])
    return withUser
  }

  async update(
    id: string,
    data: UpdateTeachingAssignmentRepositoryInput,
  ): Promise<TeachingAssignmentWithDetails> {
    const row = await this.prisma.teachingAssignment.update({
      where: { id },
      data,
      include: TEACHING_ASSIGNMENT_WITH_DETAILS_INCLUDE,
    })
    const [withUser] = await this.attachEmployeeProfiles([row])
    return withUser
  }

  async findSoftDeleted(
    employeeId: string,
    classroomId: string,
    subjectId: string,
    semesterId: string,
  ): Promise<TeachingAssignment | null> {
    return this.prisma.teachingAssignment.findFirst({
      where: {
        employeeId,
        classroomId,
        subjectId,
        semesterId,
        deletedAt: { not: null },
      },
    })
  }

  async restore(
    id: string,
    data: RestoreTeachingAssignmentRepositoryInput,
  ): Promise<TeachingAssignmentWithDetails> {
    const row = await this.prisma.teachingAssignment.update({
      where: { id },
      data: { ...data, deletedAt: null },
      include: TEACHING_ASSIGNMENT_WITH_DETAILS_INCLUDE,
    })
    const [withUser] = await this.attachEmployeeProfiles([row])
    return withUser
  }

  async softDelete(id: string): Promise<TeachingAssignment> {
    return this.prisma.teachingAssignment.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async remove(id: string): Promise<TeachingAssignment> {
    return this.softDelete(id)
  }

  async findClassroomById(id: string): Promise<ClassroomReference | null> {
    return this.prisma.classroom.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, academicYearId: true },
    })
  }

  async findSemesterById(id: string): Promise<SemesterReference | null> {
    return this.prisma.semester.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, academicYearId: true },
    })
  }
}
