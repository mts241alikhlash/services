import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import { AcademicYear } from '../../../domain/entities/academic-year.entity.js'
import {
  AcademicYearQueryInput,
  AffectedCount,
  CreateAcademicYearRepositoryInput,
  IAcademicYearRepository,
  UpdateAcademicYearRepositoryInput,
} from '../../../domain/repositories/academic-year.repository.js'
import { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'

const ACADEMIC_YEAR_SELECT = {
  id: true,
  name: true,
  startYear: true,
  isActive: true,
  deletedAt: true,
} satisfies Prisma.AcademicYearSelect

@Injectable()
export class PrismaAcademicYearRepository extends IAcademicYearRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollmentLookup: IEnrollmentLookupPort,
  ) {
    super()
  }

  async findAll(
    query: AcademicYearQueryInput,
  ): Promise<PaginatedResult<AcademicYear>> {
    const { page = 1, limit = 10, search } = query
    const skip = (page - 1) * limit

    const where: Prisma.AcademicYearWhereInput = {
      deletedAt: null,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    }

    const [data, total] = await Promise.all([
      this.prisma.academicYear.findMany({
        where,
        select: ACADEMIC_YEAR_SELECT,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.academicYear.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findById(id: string): Promise<AcademicYear | null> {
    return this.prisma.academicYear.findFirst({
      where: { id, deletedAt: null },
      select: ACADEMIC_YEAR_SELECT,
    })
  }

  async findManyByIds(ids: string[]): Promise<AcademicYear[]> {
    if (ids.length === 0) return []
    return this.prisma.academicYear.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: ACADEMIC_YEAR_SELECT,
    })
  }

  async findActive(): Promise<AcademicYear | null> {
    return this.prisma.academicYear.findFirst({
      where: { isActive: true, deletedAt: null },
      select: ACADEMIC_YEAR_SELECT,
    })
  }

  async findByName(name: string): Promise<AcademicYear | null> {
    return this.prisma.academicYear.findFirst({
      where: { name, deletedAt: null },
      select: ACADEMIC_YEAR_SELECT,
    })
  }

  async create(data: CreateAcademicYearRepositoryInput): Promise<AcademicYear> {
    return this.prisma.academicYear.create({
      data: {
        name: data.name,
        startYear: data.startYear,
        isActive: data.isActive,
      },
      select: ACADEMIC_YEAR_SELECT,
    })
  }

  async update(
    id: string,
    data: UpdateAcademicYearRepositoryInput,
  ): Promise<AcademicYear> {
    return this.prisma.academicYear.update({
      where: { id },
      data,
      select: ACADEMIC_YEAR_SELECT,
    })
  }

  async deactivateAll(excludeId?: string): Promise<AffectedCount> {
    return this.prisma.academicYear.updateMany({
      where: {
        isActive: true,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      data: { isActive: false },
    })
  }

  async activateById(id: string): Promise<AcademicYear> {
    return this.prisma.$transaction(async (tx) => {
      await tx.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })
      const activated = await tx.academicYear.update({
        where: { id },
        data: { isActive: true },
        select: ACADEMIC_YEAR_SELECT,
      })

      const firstTerm = await tx.semester.findFirst({
        where: { academicYearId: id, deletedAt: null },
        orderBy: [{ type: { sequence: 'asc' } }, { id: 'asc' }],
        select: { id: true },
      })

      if (firstTerm) {
        await tx.semester.updateMany({
          where: { isActive: true, NOT: { id: firstTerm.id } },
          data: { isActive: false },
        })
        await tx.semester.update({
          where: { id: firstTerm.id },
          data: { isActive: true },
        })
      } else {
        await tx.semester.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        })
      }

      return activated
    })
  }

  async hasRelatedData(id: string): Promise<boolean> {
    const semesters = await this.prisma.semester.findMany({
      where: { academicYearId: id, deletedAt: null },
      select: { id: true },
    })
    if (semesters.length === 0) return false

    const semesterIds = semesters.map((semester) => semester.id)

    const enrolmentCounts =
      await this.enrollmentLookup.countBySemesters(semesterIds)
    for (const count of enrolmentCounts.values()) {
      if (count > 0) return true
    }

    const assignments = await this.prisma.teachingAssignment.count({
      where: { semesterId: { in: semesterIds }, deletedAt: null },
      take: 1,
    })
    return assignments > 0
  }

  async countActive(): Promise<number> {
    return this.prisma.academicYear.count({
      where: { isActive: true, deletedAt: null },
    })
  }

  async deactivateSemestersByAcademicYearId(
    academicYearId: string,
  ): Promise<AffectedCount> {
    return this.prisma.semester.updateMany({
      where: { academicYearId, isActive: true, deletedAt: null },
      data: { isActive: false },
    })
  }

  async softDelete(id: string): Promise<AcademicYear> {
    return this.prisma.academicYear.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: ACADEMIC_YEAR_SELECT,
    })
  }
}
