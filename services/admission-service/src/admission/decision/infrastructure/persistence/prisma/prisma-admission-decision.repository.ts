import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import type {
  DecisionQueueQuery,
  DecisionQueueResult,
  DecisionTab,
} from '../../../domain/entities/decision.entity.js'
import { IAdmissionDecisionRepository } from '../../../domain/repositories/admission-decision.repository.js'

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

function tabWhere(tab: DecisionTab) {
  if (tab === 'waiting') return { status: 'VERIFIED' as const }
  if (tab === 'rejected') return { status: 'REJECTED' as const }
  return {
    status: {
      in: ['ACCEPTED' as const, 'ENROLLING' as const, 'ENROLLED' as const],
    },
  }
}

const CLEARED_DECISION = {
  decidedById: null,
  decidedAt: null,
  decisionNote: null,
}

@Injectable()
export class PrismaAdmissionDecisionRepository extends IAdmissionDecisionRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findQueue(query: DecisionQueueQuery): Promise<DecisionQueueResult> {
    const requiredTypeIds = (
      await this.prisma.admissionDocumentType.findMany({
        where: { isActive: true, isRequired: true },
        select: { id: true },
      })
    ).map((type) => type.id)

    const scope = {
      deletedAt: null,
      ...(query.waveId && { waveId: query.waveId }),
      ...textFilter(query.search),
    }
    const within = (tab: DecisionTab) => ({
      AND: [scope, tabWhere(tab)],
    })

    const [records, total, waiting, accepted, rejected] = await Promise.all([
      this.prisma.admissionApplication.findMany({
        where: within(query.tab),
        orderBy:
          query.tab === 'waiting'
            ? [{ verifiedAt: 'asc' }, { id: 'asc' }]
            : [{ decidedAt: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          registrationNumber: true,
          fullName: true,
          status: true,
          submittedAt: true,
          verifiedAt: true,
          decidedAt: true,
          decisionNote: true,
          wave: { select: { name: true } },
          documents: { select: { documentTypeId: true, status: true } },
          payment: { select: { status: true } },
        },
      }),
      this.prisma.admissionApplication.count({ where: within(query.tab) }),
      this.prisma.admissionApplication.count({ where: within('waiting') }),
      this.prisma.admissionApplication.count({ where: within('accepted') }),
      this.prisma.admissionApplication.count({ where: within('rejected') }),
    ])

    return {
      records: records.map((record) => ({
        applicationId: record.id,
        registrationNumber: record.registrationNumber,
        applicantName: record.fullName,
        waveName: record.wave.name,
        status: record.status,
        submittedAt: record.submittedAt,
        verifiedAt: record.verifiedAt,
        decidedAt: record.decidedAt,
        decisionNote: record.decisionNote,
        paymentStatus: record.payment?.status ?? null,
        documents: record.documents,
      })),
      total,
      counts: { waiting, accepted, rejected },
      requiredTypeIds,
    }
  }

  findStatus(applicationId: string): Promise<{ status: string } | null> {
    return this.prisma.admissionApplication.findFirst({
      where: { id: applicationId, deletedAt: null },
      select: { status: true },
    })
  }

  async cancelAcceptance(applicationId: string): Promise<boolean> {
    const { count } = await this.prisma.admissionApplication.updateMany({
      where: { id: applicationId, deletedAt: null, status: 'ACCEPTED' },
      data: { status: 'VERIFIED', ...CLEARED_DECISION, nis: null },
    })
    return count === 1
  }

  async cancelRejection(applicationId: string): Promise<boolean> {
    const { count } = await this.prisma.admissionApplication.updateMany({
      where: { id: applicationId, deletedAt: null, status: 'REJECTED' },
      data: { status: 'SUBMITTED', ...CLEARED_DECISION },
    })
    return count === 1
  }
}
