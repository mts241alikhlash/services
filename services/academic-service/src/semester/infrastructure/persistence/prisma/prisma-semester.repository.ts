import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import {
  Semester,
  SemesterWithDetails,
} from '../../../domain/entities/semester.entity.js'
import {
  CreateSemesterRepositoryInput,
  ISemesterRepository,
  SemesterQueryInput,
  SemesterTypeRow,
  UpdateSemesterRepositoryInput,
} from '../../../domain/repositories/semester.repository.js'
import { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import { SEMESTER_WITH_DETAILS_INCLUDE } from './prisma-semester.includes.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'

@Injectable()
export class PrismaSemesterRepository extends ISemesterRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollmentLookup: IEnrollmentLookupPort,
  ) {
    super()
  }

  async findAll(
    query: SemesterQueryInput,
  ): Promise<PaginatedResult<SemesterWithDetails>> {
    const { page = 1, limit = 10, search, academicYearId, isActive } = query
    const skip = (page - 1) * limit

    const where: Prisma.SemesterWhereInput = {
      deletedAt: null,
      academicYear: {
        deletedAt: null,
        ...(search && { name: { contains: search, mode: 'insensitive' } }),
      },
      ...(academicYearId && { academicYearId }),
      ...(isActive !== undefined && { isActive }),
    }

    const [data, total] = await Promise.all([
      this.prisma.semester.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { academicYear: { name: 'desc' } },
          { type: { sequence: 'asc' } },
          { type: { name: 'asc' } },
        ],
        include: SEMESTER_WITH_DETAILS_INCLUDE,
      }),
      this.prisma.semester.count({ where }),
    ])

    return { data: await this.attachCounts(data), total, page, limit }
  }

  private async attachCounts(
    rows: SemesterWithDetails[],
  ): Promise<SemesterWithDetails[]> {
    if (rows.length === 0) return []

    const [enrolmentCounts, assignmentCounts] = await Promise.all([
      this.enrollmentLookup.countBySemesters(rows.map((row) => row.id)),
      this.prisma.teachingAssignment.groupBy({
        by: ['semesterId'],
        where: {
          semesterId: { in: rows.map((row) => row.id) },
          deletedAt: null,
        },
        _count: { _all: true },
      }),
    ])

    const assignmentsBySemester = new Map(
      assignmentCounts.map((row) => [row.semesterId, row._count._all]),
    )

    return rows.map((row) => ({
      ...row,
      _count: {
        enrollments: enrolmentCounts.get(row.id) ?? 0,
        teachingAssignments: assignmentsBySemester.get(row.id) ?? 0,
      },
    }))
  }

  async findById(id: string): Promise<SemesterWithDetails | null> {
    return this.prisma.semester.findFirst({
      where: { id, deletedAt: null },
      include: SEMESTER_WITH_DETAILS_INCLUDE,
    })
  }

  async findManyByIds(ids: string[]): Promise<SemesterWithDetails[]> {
    if (ids.length === 0) return []
    return this.prisma.semester.findMany({
      where: { id: { in: ids }, deletedAt: null },
      include: SEMESTER_WITH_DETAILS_INCLUDE,
    })
  }

  async findActive(): Promise<SemesterWithDetails | null> {
    return this.prisma.semester.findFirst({
      where: { isActive: true, deletedAt: null },
      include: SEMESTER_WITH_DETAILS_INCLUDE,
    })
  }

  async findByAcademicYearAndType(
    academicYearId: string,
    typeId: string,
  ): Promise<Semester | null> {
    return this.prisma.semester.findFirst({
      where: { academicYearId, typeId, deletedAt: null },
    })
  }

  async create(
    data: CreateSemesterRepositoryInput,
  ): Promise<SemesterWithDetails> {
    return this.prisma.semester.create({
      data,
      include: SEMESTER_WITH_DETAILS_INCLUDE,
    })
  }

  async update(
    id: string,
    data: UpdateSemesterRepositoryInput,
  ): Promise<SemesterWithDetails> {
    return this.prisma.semester.update({
      where: { id },
      data,
      include: SEMESTER_WITH_DETAILS_INCLUDE,
    })
  }

  async deactivateAll(): Promise<{ count: number }> {
    return this.prisma.semester.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })
  }

  async activateById(id: string): Promise<SemesterWithDetails> {
    return this.prisma.$transaction(async (tx) => {
      await tx.semester.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })
      return tx.semester.update({
        where: { id },
        data: { isActive: true },
        include: SEMESTER_WITH_DETAILS_INCLUDE,
      })
    })
  }

  async findTypeById(id: string): Promise<SemesterTypeRow | null> {
    return this.prisma.semesterType.findFirst({
      where: { id, deletedAt: null },
    })
  }

  async findFirstDependent(id: string): Promise<string | null> {
    const checks: [string, () => Promise<number>][] = [
      ['student enrolments', () => this.enrollmentLookup.countBySemester(id)],
      [
        'teaching assignments',
        () =>
          this.prisma.teachingAssignment.count({
            where: { semesterId: id, deletedAt: null },
            take: 1,
          }),
      ],
      [
        'homeroom teachers',
        () =>
          this.prisma.classroomSupervisor.count({
            where: { semesterId: id, deletedAt: null },
            take: 1,
          }),
      ],
      [
        'class structures',
        () =>
          this.prisma.classroomStructure.count({
            where: { semesterId: id, deletedAt: null },
            take: 1,
          }),
      ],
      [
        'academic calendar entries',
        () =>
          this.prisma.academicCalendar.count({
            where: { semesterId: id, deletedAt: null },
            take: 1,
          }),
      ],
    ]

    for (const [name, count] of checks) {
      if ((await count()) > 0) return name
    }
    return null
  }

  async softDelete(id: string): Promise<Semester> {
    return this.prisma.semester.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}
