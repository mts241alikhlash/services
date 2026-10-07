import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import type {
  ReviewContext,
  ReviewDocument,
  ReviewQueueQuery,
  ReviewQueueResult,
  ReviewTab,
  SaveDecisionInput,
  SaveDecisionResult,
} from '../../../domain/entities/document-review.entity.js'
import { IAdmissionDocumentReviewRepository } from '../../../domain/repositories/admission-document-review.repository.js'

const PAST_SUBMITTED = [
  'VERIFIED',
  'ACCEPTED',
  'ENROLLING',
  'REJECTED',
  'ENROLLED',
] as const

const DOCUMENT_SELECT = {
  id: true,
  documentTypeId: true,
  status: true,
  note: true,
  verifiedAt: true,
  file: {
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      storageKey: true,
    },
  },
} as const

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

function approvedDocument(documentTypeId: string) {
  return {
    documents: { some: { documentTypeId, status: 'APPROVED' as const } },
  }
}

function tabWhere(tab: ReviewTab, requiredTypeIds: string[]) {
  if (tab === 'revision') return { status: 'REVISION_NEEDED' as const }
  if (tab === 'waiting') {
    return {
      status: 'SUBMITTED' as const,
      OR: requiredTypeIds.map((typeId) => ({
        NOT: approvedDocument(typeId),
      })),
    }
  }
  return {
    OR: [
      {
        status: 'SUBMITTED' as const,
        AND: requiredTypeIds.map(approvedDocument),
      },
      { status: { in: [...PAST_SUBMITTED] } },
    ],
  }
}

function toDocument(row: {
  id: string
  documentTypeId: string
  status: string
  note: string | null
  verifiedAt: Date | null
  file: ReviewDocument['file']
}): ReviewDocument {
  return {
    id: row.id,
    documentTypeId: row.documentTypeId,
    status: row.status,
    note: row.note,
    verifiedAt: row.verifiedAt,
    file: {
      id: row.file.id,
      originalName: row.file.originalName,
      mimeType: row.file.mimeType,
      storageKey: row.file.storageKey,
    },
  }
}

@Injectable()
export class PrismaAdmissionDocumentReviewRepository extends IAdmissionDocumentReviewRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findQueue(query: ReviewQueueQuery): Promise<ReviewQueueResult> {
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
    const within = (tab: ReviewTab) => ({
      AND: [scope, tabWhere(tab, requiredTypeIds)],
    })

    const [records, total, waiting, revision, done] = await Promise.all([
      this.prisma.admissionApplication.findMany({
        where: within(query.tab),
        orderBy:
          query.tab === 'waiting'
            ? [{ submittedAt: 'asc' }, { id: 'asc' }]
            : [{ updatedAt: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          registrationNumber: true,
          fullName: true,
          status: true,
          submittedAt: true,
          wave: { select: { name: true } },
          documents: { select: { documentTypeId: true, status: true } },
        },
      }),
      this.prisma.admissionApplication.count({ where: within(query.tab) }),
      this.prisma.admissionApplication.count({ where: within('waiting') }),
      this.prisma.admissionApplication.count({ where: within('revision') }),
      this.prisma.admissionApplication.count({ where: within('done') }),
    ])

    return {
      records: records.map((record) => ({
        applicationId: record.id,
        registrationNumber: record.registrationNumber,
        applicantName: record.fullName,
        waveName: record.wave.name,
        status: record.status,
        submittedAt: record.submittedAt,
        documents: record.documents,
      })),
      total,
      counts: { waiting, revision, done },
      requiredTypeIds,
    }
  }

  async findContext(applicationId: string): Promise<ReviewContext | null> {
    const [application, types] = await Promise.all([
      this.prisma.admissionApplication.findFirst({
        where: { id: applicationId, deletedAt: null },
        select: {
          id: true,
          registrationNumber: true,
          fullName: true,
          status: true,
          revisionNote: true,
          submittedAt: true,
          wave: { select: { name: true } },
          payment: { select: { status: true } },
          documents: { select: DOCUMENT_SELECT },
        },
      }),
      this.prisma.admissionDocumentType.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: { id: true, code: true, name: true, isRequired: true },
      }),
    ])
    if (!application) return null

    return {
      applicationId: application.id,
      registrationNumber: application.registrationNumber,
      applicantName: application.fullName,
      waveName: application.wave.name,
      status: application.status,
      revisionNote: application.revisionNote,
      submittedAt: application.submittedAt,
      paymentStatus: application.payment?.status ?? null,
      slots: types.map((type) => {
        const document = application.documents.find(
          (row) => row.documentTypeId === type.id,
        )
        return {
          documentTypeId: type.id,
          code: type.code,
          name: type.name,
          isRequired: type.isRequired,
          document: document ? toDocument(document) : null,
        }
      }),
    }
  }

  saveDecision(input: SaveDecisionInput): Promise<SaveDecisionResult> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM admission_applications WHERE id = ${input.applicationId}::uuid FOR UPDATE`
      const application = await tx.admissionApplication.findFirst({
        where: { id: input.applicationId, deletedAt: null },
        select: { status: true },
      })
      if (!application) return { outcome: 'NOT_FOUND' as const }
      if (application.status !== 'SUBMITTED') {
        return { outcome: 'NOT_SUBMITTED' as const }
      }
      const document = await tx.admissionDocument.findFirst({
        where: {
          id: input.documentId,
          applicationId: input.applicationId,
          documentType: { isActive: true },
        },
        select: { id: true },
      })
      if (!document) return { outcome: 'NOT_FOUND' as const }

      const updated = await tx.admissionDocument.update({
        where: { id: input.documentId },
        data: {
          status: input.status,
          note: input.note,
          verifiedById: input.adminId,
          verifiedAt: new Date(),
        },
        select: DOCUMENT_SELECT,
      })
      return { outcome: 'SAVED' as const, document: toDocument(updated) }
    })
  }

  async markRevisionNeeded(
    applicationId: string,
    note: string,
  ): Promise<boolean> {
    const { count } = await this.prisma.admissionApplication.updateMany({
      where: { id: applicationId, deletedAt: null, status: 'SUBMITTED' },
      data: { status: 'REVISION_NEEDED', revisionNote: note },
    })
    return count === 1
  }
}
