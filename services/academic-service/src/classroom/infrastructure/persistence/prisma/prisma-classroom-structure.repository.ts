import { Injectable } from '@nestjs/common'
import { ClassroomStructure, Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { resolveSemesterId } from '../../../../shared/utils/active-academic-year.helper.js'
import {
  ClassroomStructureEntity,
  StructureWithDetails,
} from '../../../domain/entities/classroom-structure.entity.js'
import {
  IClassroomStructureRepository,
  ClassroomStructureWithDetails,
} from '../../../domain/repositories/classroom-structure.repository.js'
import {
  CLASSROOM_STRUCTURE_WITH_DETAILS_INCLUDE as CLASSROOM_STRUCTURE_INCLUDE,
  StructureRow,
} from './prisma-classroom.includes.js'
import { IStudentLookupPort } from '../../../../platform/student-lookup/student-lookup.port.js'
import { IProfileLookupPort } from '../../../../platform/profile-lookup/profile-lookup.port.js'
import { resolveStudentRefs } from '../../../../shared/utils/resolve-person-refs.helper.js'
import type {
  ClassroomStructureQueryInput,
  CreateClassroomStructureRepositoryInput,
  UpdateClassroomStructureRepositoryInput,
} from '../../../domain/repositories/classroom-structure.repository.js'
import { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'

@Injectable()
export class PrismaClassroomStructureRepository extends IClassroomStructureRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentLookup: IStudentLookupPort,
    private readonly profileLookupPort: IProfileLookupPort,
  ) {
    super()
  }

  private async attachOfficers(
    rows: StructureRow[],
  ): Promise<ClassroomStructureWithDetails[]> {
    if (rows.length === 0) return []

    const students = await resolveStudentRefs(
      rows.flatMap((row) =>
        [
          row.presidentId,
          row.vicePresidentId,
          row.secretaryId,
          row.treasurerId,
        ].filter((id): id is string => id !== null),
      ),
      this.studentLookup,
      this.profileLookupPort,
    )

    return rows.map((row) => ({
      ...row,
      president: row.presidentId
        ? (students.get(row.presidentId) ?? null)
        : null,
      vicePresident: row.vicePresidentId
        ? (students.get(row.vicePresidentId) ?? null)
        : null,
      secretary: row.secretaryId
        ? (students.get(row.secretaryId) ?? null)
        : null,
      treasurer: row.treasurerId
        ? (students.get(row.treasurerId) ?? null)
        : null,
    }))
  }

  private async attachOne(
    row: StructureRow | null,
  ): Promise<ClassroomStructureWithDetails | null> {
    if (!row) return null
    const [decorated] = await this.attachOfficers([row])
    return decorated
  }

  async findAll(
    query: ClassroomStructureQueryInput,
  ): Promise<PaginatedResult<ClassroomStructureWithDetails>> {
    const { page = 1, limit = 10, classroomId, semesterId } = query
    const skip = (page - 1) * limit

    const resolvedSemesterId = await resolveSemesterId(this.prisma, semesterId)

    const where: Prisma.ClassroomStructureWhereInput = {
      deletedAt: null,
      ...(classroomId && { classroomId }),
      ...(resolvedSemesterId && { semesterId: resolvedSemesterId }),
    }

    const [data, total] = await Promise.all([
      this.prisma.classroomStructure.findMany({
        where,
        include: CLASSROOM_STRUCTURE_INCLUDE,
        skip,
        take: limit,
        orderBy: { classroomId: 'asc' },
      }),
      this.prisma.classroomStructure.count({ where }),
    ])

    return { data: await this.attachOfficers(data), total, page, limit }
  }

  async findById(id: string): Promise<ClassroomStructureWithDetails | null> {
    return this.attachOne(
      await this.prisma.classroomStructure.findFirst({
        where: { id, deletedAt: null },
        include: CLASSROOM_STRUCTURE_INCLUDE,
      }),
    )
  }

  async findStructure(
    classroomId: string,
    semesterId: string,
    excludeId?: string,
  ): Promise<StructureWithDetails | null> {
    return this.attachOne(
      await this.prisma.classroomStructure.findFirst({
        where: {
          classroomId,
          semesterId,
          deletedAt: null,
          ...(excludeId && { NOT: { id: excludeId } }),
        },
        include: CLASSROOM_STRUCTURE_INCLUDE,
      }),
    )
  }

  async create(
    data: CreateClassroomStructureRepositoryInput,
  ): Promise<ClassroomStructureWithDetails> {
    const row = await this.prisma.classroomStructure.create({
      data,
      include: CLASSROOM_STRUCTURE_INCLUDE,
    })
    const [decorated] = await this.attachOfficers([row])
    return decorated
  }

  async update(
    id: string,
    data: UpdateClassroomStructureRepositoryInput,
  ): Promise<ClassroomStructureWithDetails> {
    const row = await this.prisma.classroomStructure.update({
      where: { id },
      data,
      include: CLASSROOM_STRUCTURE_INCLUDE,
    })
    const [decorated] = await this.attachOfficers([row])
    return decorated
  }

  async remove(id: string): Promise<ClassroomStructureEntity> {
    return this.softDelete(id)
  }

  async softDelete(id: string): Promise<ClassroomStructure> {
    return this.prisma.classroomStructure.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}
