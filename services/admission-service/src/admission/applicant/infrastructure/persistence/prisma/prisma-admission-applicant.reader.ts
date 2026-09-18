import { Injectable } from '@nestjs/common'
import {
  AdmissionApplication,
  AdmissionDocumentType,
  AdmissionWave,
} from '@prisma/client'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import {
  applicationDetailInclude,
  ApplicationDetail,
} from '../../../../application/infrastructure/persistence/prisma/prisma-admission-application.includes.js'
import type { AdmissionAnnouncementWithWave } from '../../../../announcement/index.js'
import { ActiveWaveRow } from '../../../domain/repositories/admission-applicant-repository.js'
import { IReferenceLookupPort } from '../../../../../platform/reference-lookup/reference-lookup.port.js'
import {
  attachParentReferences,
  attachWaveAcademicYear,
  resolveAcademicYearNames,
} from '../../../../application/infrastructure/persistence/prisma/prisma-admission.refs.js'

@Injectable()
export class PrismaAdmissionApplicantReader {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referenceLookup: IReferenceLookupPort,
  ) {}

  async findAll(): Promise<ActiveWaveRow[]> {
    return this.findActiveWaves()
  }

  async findById(id: string): Promise<AdmissionApplication | null> {
    return this.prisma.admissionApplication.findFirst({
      where: { id, deletedAt: null },
    })
  }

  async findByUserId(userId: string): Promise<AdmissionApplication | null> {
    return this.findMyApplication(userId)
  }

  async findByRegistrationNumber(
    regNum: string,
  ): Promise<AdmissionApplication | null> {
    return this.prisma.admissionApplication.findFirst({
      where: { registrationNumber: regNum, deletedAt: null },
    })
  }

  async findOpenWave(waveId: string): Promise<AdmissionWave | null> {
    const today = new Date()
    return this.prisma.admissionWave.findFirst({
      where: {
        id: waveId,
        isActive: true,
        deletedAt: null,
        startDate: { lte: today },
        endDate: { gte: today },
      },
    })
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
      orderBy: { startDate: 'asc' },
    })
  }

  async findActiveWaves(): Promise<ActiveWaveRow[]> {
    const today = new Date()
    const rows = await this.prisma.admissionWave.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        startDate: { lte: today },
        endDate: { gte: today },
      },
      include: {
        _count: {
          select: {
            applications: {
              where: { status: { not: 'REJECTED' }, deletedAt: null },
            },
          },
        },
      },
      orderBy: { startDate: 'asc' },
    })
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

  async findActiveDocumentTypes(): Promise<AdmissionDocumentType[]> {
    return this.prisma.admissionDocumentType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async findPublishedAnnouncementsForUser(
    userId: string,
  ): Promise<AdmissionAnnouncementWithWave[]> {
    const application = await this.prisma.admissionApplication.findFirst({
      where: { userId, deletedAt: null },
      select: { waveId: true },
    })

    return this.prisma.admissionAnnouncement.findMany({
      where: {
        isPublished: true,
        deletedAt: null,
        OR: [
          { waveId: null },
          ...(application ? [{ waveId: application.waveId }] : []),
        ],
      },
      include: { wave: { select: { id: true, name: true, code: true } } },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    })
  }

  async findMyApplication(
    userId: string,
  ): Promise<AdmissionApplication | null> {
    return this.prisma.admissionApplication.findFirst({
      where: { userId, deletedAt: null },
    })
  }

  async findMyDetail(userId: string): Promise<ApplicationDetail | null> {
    const application = await this.prisma.admissionApplication.findFirst({
      where: { userId, deletedAt: null },
      include: applicationDetailInclude,
    })
    return attachWaveAcademicYear(
      await attachParentReferences(application, this.referenceLookup),
      this.referenceLookup,
    )
  }

  async findDetailById(
    applicationId: string,
  ): Promise<ApplicationDetail | null> {
    const application = await this.prisma.admissionApplication.findFirst({
      where: { id: applicationId, deletedAt: null },
      include: applicationDetailInclude,
    })
    return attachWaveAcademicYear(
      await attachParentReferences(application, this.referenceLookup),
      this.referenceLookup,
    )
  }

  async findRequiredActiveDocumentTypes(): Promise<AdmissionDocumentType[]> {
    return this.prisma.admissionDocumentType.findMany({
      where: { isActive: true, isRequired: true },
    })
  }
}
