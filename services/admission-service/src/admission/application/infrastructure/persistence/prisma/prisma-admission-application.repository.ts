import { ConflictException, Injectable, Logger } from '@nestjs/common'
import {
  AdmissionApplication,
  AdmissionDocumentType,
  Prisma,
} from '@prisma/client'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import {
  isEligibleAdmissionParent,
  hasCompleteAddress,
} from '../../../domain/policies/enroll-as-student.rules.js'
import type { PaginatedResult } from '../../../../../shared/domain/interfaces/repository.interface.js'
import { IAccountProvisioningPort } from '../../../../../platform/user/index.js'
import { IReferenceLookupPort } from '../../../../../platform/reference-lookup/reference-lookup.port.js'
import {
  attachParentReferences,
  ParentReferenceRow,
  WithParentReferences,
} from './prisma-admission.refs.js'
import {
  applicationAdminDetailInclude,
  applicationListInclude,
  ApplicationAdminDetail,
  ApplicationListItem,
} from './prisma-admission-application.includes.js'
import {
  AcceptAdmissionApplicationInput,
  AdmissionApplicationQueryInput,
  AdmissionStatusCount,
  AdmissionWaveAcceptedCount,
  ApplicationWithDocsAndPayment,
  ApplicationWithParentsAndUser,
  ApplicationWithWave,
  CreateAdmissionApplicationRepositoryInput,
  EnrollApplicantRepositoryInput,
  EnrollResult,
  IAdmissionApplicationRepository,
  RejectAdmissionApplicationInput,
  UpdateAdmissionApplicationRepositoryInput,
} from '../../../domain/repositories/admission-application-repository.js'

@Injectable()
export class PrismaAdmissionApplicationRepository extends IAdmissionApplicationRepository {
  private readonly logger = new Logger(
    PrismaAdmissionApplicationRepository.name,
  )

  constructor(
    private readonly prisma: PrismaService,
    private readonly accountProvisioning: IAccountProvisioningPort,
    private readonly referenceLookup: IReferenceLookupPort,
  ) {
    super()
  }

  private async attachAccountSummary<
    T extends {
      userId: string
      religionId?: string | null
      parents?: ParentReferenceRow[]
    },
  >(
    row: T,
  ): Promise<
    WithParentReferences<T> & {
      user: Awaited<ReturnType<IAccountProvisioningPort['findSummary']>>
      religion: { id: string; name: string } | null
    }
  > {
    const [user, withParents, religions] = await Promise.all([
      this.accountProvisioning.findSummary(row.userId),
      attachParentReferences(row, this.referenceLookup),
      this.referenceLookup.listReligions(
        row.religionId ? [row.religionId] : [],
      ),
    ])

    return {
      ...withParents,
      user,
      religion: row.religionId
        ? (religions.find((r) => r.id === row.religionId) ?? null)
        : null,
    }
  }

  async findById(id: string): Promise<AdmissionApplication | null> {
    return this.findActiveById(id)
  }

  async findByApplicantId(
    applicantId: string,
  ): Promise<AdmissionApplication | null> {
    return this.prisma.admissionApplication.findFirst({
      where: { userId: applicantId, deletedAt: null },
    })
  }

  async create(
    input: CreateAdmissionApplicationRepositoryInput,
  ): Promise<AdmissionApplication> {
    return this.prisma.admissionApplication.create({ data: input })
  }

  async update(
    id: string,
    input: UpdateAdmissionApplicationRepositoryInput,
  ): Promise<AdmissionApplication> {
    return this.prisma.admissionApplication.update({
      where: { id },
      data: input,
    })
  }

  async remove(id: string): Promise<AdmissionApplication> {
    return this.prisma.admissionApplication.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async findAll(
    query: AdmissionApplicationQueryInput,
  ): Promise<PaginatedResult<ApplicationListItem>> {
    const { page = 1, limit = 10, search, status, waveId } = query
    const skip = (page - 1) * limit

    const where: Prisma.AdmissionApplicationWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(waveId && { waveId }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { registrationNumber: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      this.prisma.admissionApplication.findMany({
        where,
        skip,
        take: limit,
        include: applicationListInclude,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.admissionApplication.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findAdminDetailById(
    id: string,
  ): Promise<ApplicationAdminDetail | null> {
    const row = await this.prisma.admissionApplication.findFirst({
      where: { id, deletedAt: null },
      include: applicationAdminDetailInclude,
    })
    return row && this.attachAccountSummary(row)
  }

  async countByNik(nik: string, excludeId: string): Promise<number> {
    return this.prisma.admissionApplication.count({
      where: { nik, id: { not: excludeId }, deletedAt: null },
    })
  }

  async findActiveDocumentTypes(): Promise<AdmissionDocumentType[]> {
    return this.prisma.admissionDocumentType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async getStatusCounts(waveId?: string): Promise<AdmissionStatusCount[]> {
    const grouped = await this.prisma.admissionApplication.groupBy({
      by: ['status'],
      where: { deletedAt: null, ...(waveId && { waveId }) },
      _count: { _all: true },
    })
    return grouped.map((g) => ({ status: g.status, count: g._count._all }))
  }

  async getWavesWithAcceptedCount(
    waveId?: string,
  ): Promise<AdmissionWaveAcceptedCount[]> {
    const waves = await this.prisma.admissionWave.findMany({
      where: { deletedAt: null, ...(waveId && { id: waveId }) },
      include: {
        _count: {
          select: {
            applications: {
              where: {
                status: { in: ['ACCEPTED', 'ENROLLED'] },
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    })

    return waves.map((w) => ({
      id: w.id,
      name: w.name,
      code: w.code,
      quota: w.quota,
      accepted: w._count.applications,
    }))
  }

  async findActiveById(id: string): Promise<AdmissionApplication | null> {
    return this.prisma.admissionApplication.findFirst({
      where: { id, deletedAt: null },
    })
  }

  async findActiveWithWave(id: string): Promise<ApplicationWithWave | null> {
    return this.prisma.admissionApplication.findFirst({
      where: { id, deletedAt: null },
      include: { wave: true },
    })
  }

  async findActiveWithDocsAndPayment(
    id: string,
  ): Promise<ApplicationWithDocsAndPayment | null> {
    return this.prisma.admissionApplication.findFirst({
      where: { id, deletedAt: null },
      include: { documents: true, payment: true },
    })
  }

  async findActiveWithParentsAndUser(
    id: string,
  ): Promise<ApplicationWithParentsAndUser | null> {
    const row = await this.prisma.admissionApplication.findFirst({
      where: { id, deletedAt: null },
      include: { parents: true },
    })
    return attachParentReferences(row, this.referenceLookup)
  }

  async countAcceptedInWave(waveId: string): Promise<number> {
    return this.prisma.admissionApplication.count({
      where: {
        waveId,
        status: { in: ['ACCEPTED', 'ENROLLED'] },
        deletedAt: null,
      },
    })
  }

  async findRequiredActiveDocumentTypes(): Promise<AdmissionDocumentType[]> {
    return this.prisma.admissionDocumentType.findMany({
      where: { isActive: true, isRequired: true },
    })
  }

  async setRevisionNeeded(
    id: string,
    note: string,
  ): Promise<ApplicationAdminDetail> {
    const row = await this.prisma.admissionApplication.update({
      where: { id },
      data: { status: 'REVISION_NEEDED', revisionNote: note },
      include: applicationAdminDetailInclude,
    })
    return this.attachAccountSummary(row)
  }

  async setVerified(
    id: string,
    adminId: string,
  ): Promise<ApplicationAdminDetail> {
    const row = await this.prisma.admissionApplication.update({
      where: { id },
      data: {
        status: 'VERIFIED',
        verifiedById: adminId,
        verifiedAt: new Date(),
      },
      include: applicationAdminDetailInclude,
    })
    return this.attachAccountSummary(row)
  }

  async setAccepted(
    input: AcceptAdmissionApplicationInput,
  ): Promise<ApplicationAdminDetail> {
    const row = await this.prisma.admissionApplication.update({
      where: { id: input.id },
      data: {
        status: 'ACCEPTED',
        decidedById: input.adminId,
        decidedAt: new Date(),
        decisionNote: input.note,
      },
      include: applicationAdminDetailInclude,
    })
    return this.attachAccountSummary(row)
  }

  async setRejected(
    input: RejectAdmissionApplicationInput,
  ): Promise<ApplicationAdminDetail> {
    const row = await this.prisma.admissionApplication.update({
      where: { id: input.id },
      data: {
        status: 'REJECTED',
        decidedById: input.adminId,
        decidedAt: new Date(),
        decisionNote: input.reason,
      },
      include: applicationAdminDetailInclude,
    })
    return this.attachAccountSummary(row)
  }

  async setEnrolling(id: string): Promise<ApplicationAdminDetail> {
    const row = await this.prisma.admissionApplication.update({
      where: { id },
      data: { status: 'ENROLLING' },
      include: applicationAdminDetailInclude,
    })
    return this.attachAccountSummary(row)
  }

  async markEnrolled(
    id: string,
    enrolledStudentId: string,
  ): Promise<ApplicationAdminDetail> {
    const row = await this.prisma.admissionApplication.update({
      where: { id },
      data: { status: 'ENROLLED', enrolledStudentId },
      include: applicationAdminDetailInclude,
    })
    return this.attachAccountSummary(row)
  }
}
