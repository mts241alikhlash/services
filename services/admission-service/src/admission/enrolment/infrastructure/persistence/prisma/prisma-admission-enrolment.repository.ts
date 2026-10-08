import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import type {
  EnrolmentQueueQuery,
  EnrolmentQueueResult,
  EnrolmentTab,
  NisCandidateRow,
  Placement,
  PlacementState,
  ProcessState,
} from '../../../domain/entities/enrolment.entity.js'
import { IAdmissionEnrolmentRepository } from '../../../domain/repositories/admission-enrolment.repository.js'

const ENROLMENT_STATUSES = ['ACCEPTED', 'ENROLLING', 'ENROLLED'] as const

function textFilter(search: string | undefined) {
  const text = search?.trim().replace(/[\\%_]/g, '\\$&')
  if (!text) return {}
  return {
    OR: [
      { fullName: { contains: text, mode: 'insensitive' as const } },
      { registrationNumber: { contains: text, mode: 'insensitive' as const } },
    ],
  }
}

function tabWhere(tab: EnrolmentTab) {
  if (tab === 'ready') return { status: 'ACCEPTED' as const }
  if (tab === 'held') return { status: 'ENROLLING' as const }
  return { status: 'ENROLLED' as const }
}

@Injectable()
export class PrismaAdmissionEnrolmentRepository extends IAdmissionEnrolmentRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findQueue(query: EnrolmentQueueQuery): Promise<EnrolmentQueueResult> {
    const scope = {
      deletedAt: null,
      ...(query.waveId && { waveId: query.waveId }),
      ...textFilter(query.search),
    }
    const within = (tab: EnrolmentTab) => ({ AND: [scope, tabWhere(tab)] })

    const [records, yearRows, total, ready, held, done] = await Promise.all([
      this.prisma.admissionApplication.findMany({
        where: within(query.tab),
        orderBy: [{ fullName: 'asc' }, { registrationNumber: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          registrationNumber: true,
          fullName: true,
          status: true,
          admissionType: true,
          targetGradeLevel: true,
          nis: true,
          nisn: true,
          enrolledStudentId: true,
          wave: { select: { name: true, academicYearId: true } },
        },
      }),
      this.prisma.admissionApplication.findMany({
        where: { deletedAt: null, status: { in: [...ENROLMENT_STATUSES] } },
        distinct: ['waveId'],
        select: { wave: { select: { academicYearId: true } } },
      }),
      this.prisma.admissionApplication.count({ where: within(query.tab) }),
      this.prisma.admissionApplication.count({ where: within('ready') }),
      this.prisma.admissionApplication.count({ where: within('held') }),
      this.prisma.admissionApplication.count({ where: within('done') }),
    ])

    const yearIds = [...new Set(yearRows.map((row) => row.wave.academicYearId))]
    const locks = await this.prisma.admissionNisLock.findMany({
      where: { academicYearId: { in: yearIds } },
      select: { academicYearId: true, lockedAt: true },
    })

    return {
      records: records.map((record) => ({
        applicationId: record.id,
        registrationNumber: record.registrationNumber,
        applicantName: record.fullName,
        waveName: record.wave.name,
        academicYearId: record.wave.academicYearId,
        status: record.status,
        admissionType: record.admissionType,
        targetGradeLevel: record.targetGradeLevel,
        nis: record.nis,
        nisn: record.nisn,
        enrolledStudentId: record.enrolledStudentId,
      })),
      total,
      counts: { ready, held, done },
      years: yearIds.map((academicYearId) => ({
        academicYearId,
        lockedAt:
          locks.find((lock) => lock.academicYearId === academicYearId)
            ?.lockedAt ?? null,
      })),
    }
  }

  async findNisCandidates(academicYearId: string): Promise<NisCandidateRow[]> {
    const rows = await this.prisma.admissionApplication.findMany({
      where: {
        deletedAt: null,
        status: { in: [...ENROLMENT_STATUSES] },
        wave: { academicYearId },
      },
      select: {
        id: true,
        fullName: true,
        registrationNumber: true,
        status: true,
        targetGradeLevel: true,
        nis: true,
        enrolledStudentId: true,
      },
    })
    return rows.map((row) => ({
      applicationId: row.id,
      fullName: row.fullName,
      registrationNumber: row.registrationNumber,
      status: row.status,
      gradeLevel: row.targetGradeLevel,
      currentNis: row.nis,
      studentId: row.enrolledStudentId,
    }))
  }

  async writeNis(
    changes: { applicationId: string; nis: string | null }[],
  ): Promise<void> {
    if (changes.length === 0) return
    await this.prisma.$transaction(async (tx) => {
      await tx.admissionApplication.updateMany({
        where: { id: { in: changes.map((change) => change.applicationId) } },
        data: { nis: null },
      })
      for (const change of changes) {
        await tx.admissionApplication.update({
          where: { id: change.applicationId },
          data: { nis: change.nis },
        })
      }
    })
  }

  async isNisLocked(academicYearId: string): Promise<boolean> {
    const lock = await this.prisma.admissionNisLock.findUnique({
      where: { academicYearId },
      select: { id: true },
    })
    return lock !== null
  }

  async lockNis(
    academicYearId: string,
    lockedById: string,
  ): Promise<{ lockedAt: Date } | null> {
    try {
      return await this.prisma.admissionNisLock.create({
        data: { academicYearId, lockedById },
        select: { lockedAt: true },
      })
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') return null
      throw error
    }
  }

  async findPlacementState(
    applicationId: string,
  ): Promise<PlacementState | null> {
    const row = await this.prisma.admissionApplication.findFirst({
      where: { id: applicationId, deletedAt: null },
      select: {
        status: true,
        nis: true,
        targetGradeLevel: true,
        wave: { select: { academicYearId: true } },
      },
    })
    if (!row) return null
    return {
      status: row.status,
      nis: row.nis,
      targetGradeLevel: row.targetGradeLevel,
      academicYearId: row.wave.academicYearId,
    }
  }

  async setPlacement(
    applicationId: string,
    placement: Placement,
    clearNis: boolean,
  ): Promise<void> {
    await this.prisma.admissionApplication.update({
      where: { id: applicationId },
      data: { ...placement, ...(clearNis && { nis: null }) },
    })
  }

  findProcessState(applicationId: string): Promise<ProcessState | null> {
    return this.prisma.admissionApplication.findFirst({
      where: { id: applicationId, deletedAt: null },
      select: { status: true, nis: true, nisn: true, targetGradeId: true },
    })
  }
}
