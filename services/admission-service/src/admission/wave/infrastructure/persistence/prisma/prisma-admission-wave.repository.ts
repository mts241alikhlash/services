import { Injectable } from '@nestjs/common'
import { AdmissionWave, Prisma } from '@prisma/client'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import { PaginatedResult } from '../../../../../shared/domain/interfaces/repository.interface.js'
import { AcademicYearRef } from '../../../../../shared/domain/entities/reference.entity.js'
import { IReferenceLookupPort } from '../../../../../platform/reference-lookup/reference-lookup.port.js'
import {
  AdmissionWaveQueryInput,
  AdmissionWaveWithAcademicYear,
  AdmissionWaveWithRelations,
  CreateAdmissionWaveRepositoryInput,
  IAdmissionWaveRepository,
  UpdateAdmissionWaveRepositoryInput,
} from '../../../domain/repositories/admission-wave-repository.js'

const WAVE_INCLUDE = {
  _count: { select: { applications: { where: { deletedAt: null } } } },
} satisfies Prisma.AdmissionWaveInclude

async function resolveAcademicYearNames(
  referenceLookup: IReferenceLookupPort,
  ids: string[],
): Promise<Map<string, AcademicYearRef>> {
  const rows = await referenceLookup.listAcademicYears(ids)
  return new Map(rows.map((row) => [row.id, row]))
}

@Injectable()
export class PrismaAdmissionWaveRepository extends IAdmissionWaveRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceLookup: IReferenceLookupPort,
  ) {
    super()
  }

  private async attachAcademicYears<T extends { academicYearId: string }>(
    rows: T[],
  ): Promise<(T & { academicYear: AcademicYearRef | null })[]> {
    if (rows.length === 0) return []

    const years = await resolveAcademicYearNames(
      this.referenceLookup,
      rows.map((row) => row.academicYearId),
    )
    return rows.map((row) => ({
      ...row,
      academicYear: years.get(row.academicYearId) ?? null,
    }))
  }

  async findAll(
    query: AdmissionWaveQueryInput,
  ): Promise<PaginatedResult<AdmissionWaveWithRelations>> {
    const { page = 1, limit = 10, search, academicYearId, isActive } = query
    const skip = (page - 1) * limit

    const where: Prisma.AdmissionWaveWhereInput = {
      deletedAt: null,
      ...(academicYearId && { academicYearId }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      this.prisma.admissionWave.findMany({
        where,
        skip,
        take: limit,
        include: WAVE_INCLUDE,
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.admissionWave.count({ where }),
    ])

    return {
      data: await this.attachAcademicYears(data),
      total,
      page,
      limit,
    }
  }

  async findById(id: string): Promise<AdmissionWaveWithRelations | null> {
    const row = await this.prisma.admissionWave.findFirst({
      where: { id, deletedAt: null },
      include: WAVE_INCLUDE,
    })
    if (!row) return null
    const [withYear] = await this.attachAcademicYears([row])
    return withYear
  }

  async findByCode(code: string): Promise<AdmissionWave | null> {
    return this.prisma.admissionWave.findUnique({ where: { code } })
  }

  async findActiveWave(): Promise<AdmissionWave | null> {
    const today = new Date()
    return this.prisma.admissionWave.findFirst({
      where: {
        isActive: true,
        deletedAt: null,
        startDate: { lte: today },
        endDate: { gte: today },
      },
    })
  }

  async create(
    data: CreateAdmissionWaveRepositoryInput,
  ): Promise<AdmissionWaveWithAcademicYear> {
    const row = await this.prisma.admissionWave.create({ data })
    const [withYear] = await this.attachAcademicYears([row])
    return withYear
  }

  async update(
    id: string,
    data: UpdateAdmissionWaveRepositoryInput,
  ): Promise<AdmissionWaveWithAcademicYear> {
    const row = await this.prisma.admissionWave.update({ where: { id }, data })
    const [withYear] = await this.attachAcademicYears([row])
    return withYear
  }

  async remove(id: string): Promise<AdmissionWave> {
    return this.softDelete(id)
  }

  async softDelete(id: string): Promise<AdmissionWave> {
    return this.prisma.admissionWave.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    })
  }
}
