import { Injectable } from '@nestjs/common'
import { Classroom, Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import {
  resolveAcademicYearId,
  resolveSemesterId,
} from '../../../../shared/utils/active-academic-year.helper.js'
import {
  IClassroomRepository,
  ClassroomWithDetails,
  ClassroomEntity,
} from '../../../domain/repositories/classroom.repository.js'
import {
  CLASSROOM_WITH_DETAILS_INCLUDE as CLASS_INCLUDE,
  classroomWithDetailsInclude,
} from './prisma-classroom.includes.js'
import type {
  ClassroomDetailRow,
  ClassroomQueryInput,
  CopyClassroomsResult,
  CreateClassroomRepositoryInput,
  UpdateClassroomRepositoryInput,
} from '../../../domain/repositories/classroom.repository.js'
import { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import { IEmployeeLookupPort } from '../../../../platform/employee-lookup/employee-lookup.port.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import { resolveEmployeeRefs } from '../../../../shared/utils/resolve-person-refs.helper.js'

@Injectable()
export class PrismaClassroomRepository extends IClassroomRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollmentLookup: IEnrollmentLookupPort,
    private readonly employeeLookup: IEmployeeLookupPort,
    private readonly profileLookupPort: IProfileLookupPort,
  ) {
    super()
  }

  private async attachSupervisors(
    rows: ClassroomWithDetails[],
  ): Promise<ClassroomWithDetails[]> {
    if (rows.length === 0) return []

    const employees = await resolveEmployeeRefs(
      rows.flatMap(
        (row) =>
          row.classroomSupervisors?.map(
            (supervisor) => supervisor.employeeId,
          ) ?? [],
      ),
      this.employeeLookup,
      this.profileLookupPort,
    )

    return rows.map((row) => ({
      ...row,
      classroomSupervisors: row.classroomSupervisors?.map((supervisor) => ({
        ...supervisor,
        employee: employees.get(supervisor.employeeId),
      })),
    }))
  }

  async findAll(
    query: ClassroomQueryInput,
  ): Promise<PaginatedResult<ClassroomWithDetails>> {
    const page = Number(query.page ?? 1)
    const limit = Number(query.limit ?? 10)
    const { academicYearId, gradeId, search, isActive } = query
    const skip = (page - 1) * limit

    const resolvedAcademicYearId = await resolveAcademicYearId(
      this.prisma,
      academicYearId,
    )

    const resolvedSemesterId = await resolveSemesterId(this.prisma, undefined)

    const where: Prisma.ClassroomWhereInput = {
      deletedAt: null,
      ...(resolvedAcademicYearId && { academicYearId: resolvedAcademicYearId }),
      ...(gradeId && { gradeId }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      this.prisma.classroom.findMany({
        where,
        include: classroomWithDetailsInclude(resolvedSemesterId),
        skip,
        take: limit,
        orderBy: [{ grade: { level: 'asc' } }, { code: 'asc' }],
      }),
      this.prisma.classroom.count({ where }),
    ])

    return { data: await this.attachSupervisors(data), total, page, limit }
  }

  async findById(id: string): Promise<ClassroomWithDetails | null> {
    const row = await this.prisma.classroom.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: CLASS_INCLUDE,
    })
    if (!row) return null
    const [withSupervisor] = await this.attachSupervisors([row])
    return withSupervisor
  }

  async findDetailsByIds(ids: string[]): Promise<ClassroomDetailRow[]> {
    if (ids.length === 0) return []
    return this.prisma.classroom.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: {
        id: true,
        code: true,
        name: true,
        gradeId: true,
        academicYearId: true,
        capacity: true,
        grade: { select: { level: true, name: true } },
      },
    })
  }

  async findDuplicate(
    code: string,
    academicYearId?: string,
    excludeId?: string,
  ): Promise<ClassroomEntity | null> {
    return this.prisma.classroom.findFirst({
      where: {
        code,
        ...(academicYearId && { academicYearId }),
        deletedAt: null,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    })
  }

  async create(
    data: CreateClassroomRepositoryInput,
  ): Promise<ClassroomWithDetails> {
    return this.prisma.classroom.create({ data, include: CLASS_INCLUDE })
  }

  async update(
    id: string,
    data: UpdateClassroomRepositoryInput,
  ): Promise<ClassroomWithDetails> {
    return this.prisma.classroom.update({
      where: { id },
      data,
      include: CLASS_INCLUDE,
    })
  }

  async findByCode(
    code: string,
    excludeId?: string,
  ): Promise<ClassroomEntity | null> {
    return this.prisma.classroom.findFirst({
      where: {
        code: { equals: code, mode: 'insensitive' },
        deletedAt: null,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    })
  }

  async findByName(
    name: string,
    academicYearId: string,
    excludeId?: string,
  ): Promise<ClassroomEntity | null> {
    return this.prisma.classroom.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        academicYearId,
        deletedAt: null,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    })
  }

  async remove(id: string): Promise<Classroom> {
    return this.softDelete(id)
  }

  async softDelete(id: string): Promise<Classroom> {
    return this.prisma.classroom.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async countEnrollments(id: string): Promise<number> {
    return this.enrollmentLookup.countByClassroom(id)
  }

  async countTeachingAssignments(id: string): Promise<number> {
    return this.prisma.teachingAssignment.count({
      where: { classroomId: id, deletedAt: null },
    })
  }

  async copyToAcademicYear(
    sourceAcademicYearId: string,
    targetAcademicYearId: string,
  ): Promise<CopyClassroomsResult> {
    const source = await this.prisma.classroom.findMany({
      where: { academicYearId: sourceAcademicYearId, deletedAt: null },
      select: {
        gradeId: true,
        code: true,
        name: true,
        capacity: true,
        isActive: true,
      },
      orderBy: [{ gradeId: 'asc' }, { code: 'asc' }],
    })

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.classroom.findMany({
        where: { academicYearId: targetAcademicYearId, deletedAt: null },
        select: { gradeId: true, code: true },
      })
      const taken = new Set(existing.map((row) => `${row.gradeId}:${row.code}`))

      const toCreate = source.filter(
        (row) => !taken.has(`${row.gradeId}:${row.code}`),
      )

      if (toCreate.length > 0) {
        await tx.classroom.createMany({
          data: toCreate.map((row) => ({
            academicYearId: targetAcademicYearId,
            gradeId: row.gradeId,
            code: row.code,
            name: row.name,
            capacity: row.capacity,
            isActive: row.isActive,
          })),
        })
      }

      return {
        created: toCreate.length,
        skipped: source.length - toCreate.length,
      }
    })
  }
}
