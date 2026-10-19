import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import {
  TRACKED_STATUSES,
  type LateDocumentPair,
  type LateDocumentType,
} from '../../../domain/late-document.entity.js'
import { ILateDocumentRepository } from '../../../domain/repositories/late-document.repository.js'

const TYPE_SELECT = {
  id: true,
  code: true,
  name: true,
  lateDueMonths: true,
} as const

type ApplicationRow = {
  id: string
  registrationNumber: string
  fullName: string
  status: string
  targetGradeLevel: number | null
  wave: { id: string; name: string }
  documents: {
    id: string
    documentTypeId: string
    fileId: string
    status: string
    note: string | null
  }[]
}

function applicationSelect(typeIds: string[]) {
  return {
    id: true,
    registrationNumber: true,
    fullName: true,
    status: true,
    targetGradeLevel: true,
    wave: { select: { id: true, name: true } },
    documents: {
      where: { documentTypeId: { in: typeIds } },
      select: {
        id: true,
        documentTypeId: true,
        fileId: true,
        status: true,
        note: true,
      },
    },
  } as const
}

function toPair(
  application: ApplicationRow,
  type: LateDocumentType,
): LateDocumentPair {
  const document = application.documents.find(
    (row) => row.documentTypeId === type.id,
  )
  return {
    applicationId: application.id,
    registrationNumber: application.registrationNumber,
    applicantName: application.fullName,
    applicationStatus: application.status,
    waveId: application.wave.id,
    waveName: application.wave.name,
    gradeLevel: application.targetGradeLevel,
    documentType: type,
    document: document
      ? {
          id: document.id,
          fileId: document.fileId,
          status: document.status as 'PENDING' | 'APPROVED' | 'REJECTED',
          note: document.note,
        }
      : null,
  }
}

@Injectable()
export class PrismaLateDocumentRepository extends ILateDocumentRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async resolvePpdbYearId(): Promise<string | null> {
    const active = await this.prisma.admissionWave.findFirst({
      where: { isActive: true, deletedAt: null },
      orderBy: { startDate: 'desc' },
      select: { academicYearId: true },
    })
    if (active) return active.academicYearId
    const latest = await this.prisma.admissionWave.findFirst({
      where: { deletedAt: null },
      orderBy: { startDate: 'desc' },
      select: { academicYearId: true },
    })
    return latest?.academicYearId ?? null
  }

  async findTrackedPairs(academicYearId: string): Promise<LateDocumentPair[]> {
    const types = await this.prisma.admissionDocumentType.findMany({
      where: { isActive: true, requirement: 'LATER' },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: TYPE_SELECT,
    })
    if (types.length === 0) return []
    const applications = await this.prisma.admissionApplication.findMany({
      where: {
        deletedAt: null,
        status: { in: [...TRACKED_STATUSES] },
        wave: { academicYearId },
      },
      select: applicationSelect(types.map((type) => type.id)),
    })
    return applications.flatMap((application) =>
      types.map((type) => toPair(application, type)),
    )
  }

  async findPair(
    applicationId: string,
    documentTypeId: string,
  ): Promise<LateDocumentPair | null> {
    const type = await this.prisma.admissionDocumentType.findFirst({
      where: { id: documentTypeId, isActive: true, requirement: 'LATER' },
      select: TYPE_SELECT,
    })
    if (!type) return null
    const application = await this.prisma.admissionApplication.findFirst({
      where: { id: applicationId, deletedAt: null },
      select: applicationSelect([type.id]),
    })
    return application ? toPair(application, type) : null
  }
}
