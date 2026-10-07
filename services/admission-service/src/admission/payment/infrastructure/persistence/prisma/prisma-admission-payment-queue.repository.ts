import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import {
  IAdmissionPaymentQueueRepository,
  type EligibleApplicationRow,
  type PaymentQueueQuery,
  type PaymentQueueResult,
  type PaymentQueueRow,
} from '../../../domain/repositories/admission-payment-queue-repository.js'

const ELIGIBLE_STATUSES = ['DRAFT', 'SUBMITTED', 'REVISION_NEEDED'] as const

const ROW_SELECT = {
  id: true,
  amount: true,
  status: true,
  note: true,
  bankName: true,
  senderAccountName: true,
  transferDate: true,
  verifiedById: true,
  verifiedAt: true,
  updatedAt: true,
  bankAccount: {
    select: {
      id: true,
      bankName: true,
      accountNumber: true,
      accountHolder: true,
    },
  },
  proofFile: {
    select: {
      id: true,
      filename: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      storageKey: true,
      uploadedBy: true,
    },
  },
  application: {
    select: {
      id: true,
      userId: true,
      registrationNumber: true,
      fullName: true,
      status: true,
      wave: { select: { id: true, name: true } },
    },
  },
} as const

function textFilter(search: string | undefined) {
  const text = search?.trim()
  if (!text) return {}
  return {
    OR: [
      { fullName: { contains: text, mode: 'insensitive' as const } },
      { registrationNumber: { contains: text, mode: 'insensitive' as const } },
    ],
  }
}

@Injectable()
export class PrismaAdmissionPaymentQueueRepository extends IAdmissionPaymentQueueRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findQueue(query: PaymentQueueQuery): Promise<PaymentQueueResult> {
    const scope = {
      application: {
        is: {
          deletedAt: null,
          ...(query.waveId && { waveId: query.waveId }),
          ...textFilter(query.search),
        },
      },
    }
    const where = { ...scope, status: query.status }

    const [records, total, grouped] = await Promise.all([
      this.prisma.admissionPayment.findMany({
        where,
        orderBy: { updatedAt: query.status === 'PENDING' ? 'asc' : 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: ROW_SELECT,
      }),
      this.prisma.admissionPayment.count({ where }),
      this.prisma.admissionPayment.groupBy({
        by: ['status'],
        where: scope,
        _count: { _all: true },
      }),
    ])

    const countOf = (status: string) =>
      grouped.find((group) => group.status === status)?._count._all ?? 0

    return {
      rows: records.map((record) => this.toRow(record)),
      total,
      counts: {
        pending: countOf('PENDING'),
        verified: countOf('VERIFIED'),
        rejected: countOf('REJECTED'),
      },
    }
  }

  async findEligibleApplications(
    search: string | undefined,
    limit: number,
  ): Promise<EligibleApplicationRow[]> {
    const rows = await this.prisma.admissionApplication.findMany({
      where: {
        deletedAt: null,
        status: { in: [...ELIGIBLE_STATUSES] },
        payment: { is: { status: { not: 'VERIFIED' } } },
        ...textFilter(search),
      },
      orderBy: { fullName: 'asc' },
      take: limit,
      select: {
        id: true,
        registrationNumber: true,
        fullName: true,
        status: true,
        wave: { select: { name: true } },
        payment: { select: { amount: true } },
      },
    })
    return rows.map((row) => ({
      applicationId: row.id,
      registrationNumber: row.registrationNumber,
      applicantName: row.fullName,
      applicationStatus: row.status,
      waveName: row.wave.name,
      amount: row.payment?.amount ?? 0,
    }))
  }

  private toRow(record: {
    id: string
    amount: PaymentQueueRow['amount']
    status: string
    note: string | null
    bankName: string | null
    senderAccountName: string | null
    transferDate: Date | null
    verifiedById: string | null
    verifiedAt: Date | null
    updatedAt: Date
    bankAccount: PaymentQueueRow['bankAccount']
    proofFile: {
      id: string
      filename: string
      originalName: string
      mimeType: string
      sizeBytes: number
      storageKey: string
      uploadedBy: string | null
    } | null
    application: {
      id: string
      userId: string
      registrationNumber: string
      fullName: string
      status: string
      wave: { id: string; name: string }
    }
  }): PaymentQueueRow {
    const { application, proofFile } = record
    return {
      paymentId: record.id,
      applicationId: application.id,
      registrationNumber: application.registrationNumber,
      applicantName: application.fullName,
      applicationStatus: application.status,
      waveId: application.wave.id,
      waveName: application.wave.name,
      amount: record.amount,
      status: record.status as PaymentQueueRow['status'],
      note: record.note,
      bankName: record.bankName,
      senderAccountName: record.senderAccountName,
      transferDate: record.transferDate,
      bankAccount: record.bankAccount,
      proofFile: proofFile
        ? {
            id: proofFile.id,
            filename: proofFile.filename,
            originalName: proofFile.originalName,
            mimeType: proofFile.mimeType,
            sizeBytes: proofFile.sizeBytes,
            storageKey: proofFile.storageKey,
          }
        : null,
      proofUploadedByStaff: proofFile
        ? proofFile.uploadedBy !== application.userId
        : false,
      verifiedById: record.verifiedById,
      verifiedAt: record.verifiedAt,
      updatedAt: record.updatedAt,
    }
  }
}
