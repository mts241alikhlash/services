import { Injectable } from '@nestjs/common'
import {
  EducationSummary,
  IAcademicLookupPort,
  OccupationSummary,
} from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { Parent, Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import type {
  ParentQueryInput,
  CreateParentRepositoryInput,
  UpdateParentRepositoryInput,
} from '../../../domain/repositories/parent.repository.js'
import { IParentRepository } from '../../../domain/repositories/parent.repository.js'
import { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import {
  PARENT_LIST_INCLUDE,
  PARENT_DETAIL_INCLUDE,
  ParentWithDetails,
  ParentListWithDetails,
} from './prisma-parent.includes.js'

@Injectable()
export class PrismaParentRepository extends IParentRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly academicLookup: IAcademicLookupPort,
  ) {
    super()
  }

  async findAll(
    query: ParentQueryInput,
  ): Promise<PaginatedResult<ParentListWithDetails>> {
    const { page = 1, limit = 10, search, occupationId } = query
    const skip = (page - 1) * limit

    const where: Prisma.ParentWhereInput = {
      deletedAt: null,
      ...(occupationId && { occupationId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { nik: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      this.prisma.parent.findMany({
        where,
        include: PARENT_LIST_INCLUDE,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.parent.count({ where }),
    ])

    return {
      data: await this.attachReferences(data),
      total,
      page,
      limit,
    }
  }

  private async attachReferences<
    T extends { occupationId: string; educationId: string | null },
  >(
    rows: T[],
  ): Promise<
    (T & {
      occupation: OccupationSummary | null
      education: EducationSummary | null
    })[]
  > {
    if (rows.length === 0) return []

    const [occupations, educations] = await Promise.all([
      this.academicLookup.listOccupationsByIds([
        ...new Set(rows.map((row) => row.occupationId)),
      ]),
      this.academicLookup.listEducationsByIds([
        ...new Set(
          rows
            .map((row) => row.educationId)
            .filter((id): id is string => id !== null),
        ),
      ]),
    ])
    const occupationById = new Map(occupations.map((row) => [row.id, row]))
    const educationById = new Map(educations.map((row) => [row.id, row]))

    return rows.map((row) => ({
      ...row,
      occupation: occupationById.get(row.occupationId) ?? null,
      education: row.educationId
        ? (educationById.get(row.educationId) ?? null)
        : null,
    }))
  }

  async findById(id: string): Promise<ParentWithDetails | null> {
    const row = await this.prisma.parent.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: PARENT_DETAIL_INCLUDE,
    })
    if (!row) return null
    const [withRefs] = await this.attachReferences([row])
    return withRefs
  }

  async findByNik(
    nik: string,
    excludeId?: string,
  ): Promise<ParentWithDetails | null> {
    const row = await this.prisma.parent.findFirst({
      where: {
        nik,
        deletedAt: null,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
      include: PARENT_DETAIL_INCLUDE,
    })
    if (!row) return null
    const [withRefs] = await this.attachReferences([row])
    return withRefs
  }

  async countByOccupation(occupationId: string): Promise<number> {
    return this.prisma.parent.count({
      where: { occupationId, deletedAt: null },
    })
  }

  async findOccupationById(id: string): Promise<OccupationSummary | null> {
    return this.academicLookup.findOccupation(id)
  }

  async create(dto: CreateParentRepositoryInput): Promise<ParentWithDetails> {
    const row = await this.prisma.parent.create({
      data: dto,
      include: PARENT_DETAIL_INCLUDE,
    })
    const [withRefs] = await this.attachReferences([row])
    return withRefs
  }

  async update(
    id: string,
    dto: UpdateParentRepositoryInput,
  ): Promise<ParentWithDetails> {
    const row = await this.prisma.parent.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.birthDate && { birthDate: dto.birthDate }),
      },
      include: PARENT_DETAIL_INCLUDE,
    })
    const [withRefs] = await this.attachReferences([row])
    return withRefs
  }

  async remove(id: string): Promise<Parent> {
    return this.softDelete(id)
  }

  async softDelete(id: string): Promise<Parent> {
    return this.prisma.parent.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}
