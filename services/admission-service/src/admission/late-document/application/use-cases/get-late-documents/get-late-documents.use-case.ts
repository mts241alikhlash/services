import { Injectable } from '@nestjs/common'
import { IReferenceLookupPort } from '../../../../../platform/reference-lookup/reference-lookup.port.js'
import type {
  LateDocumentPair,
  LateDocumentQuery,
  LateDocumentRow,
} from '../../../domain/late-document.entity.js'
import {
  compareByUrgency,
  deriveLateDocument,
  limitDateOf,
  overdueAfterOf,
} from '../../../domain/late-document.policy.js'
import { ILateDocumentRepository } from '../../../domain/repositories/late-document.repository.js'

const OPEN_STATES = ['MISSING', 'PENDING', 'REJECTED']

@Injectable()
export class GetLateDocumentsUseCase {
  constructor(
    private readonly repository: ILateDocumentRepository,
    private readonly lookup: IReferenceLookupPort,
  ) {}

  async execute(query: LateDocumentQuery, now: Date = new Date()) {
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const yearId = await this.repository.resolvePpdbYearId()
    if (!yearId) return this.empty(page, limit)

    const [pairs, timeline] = await Promise.all([
      this.repository.findTrackedPairs(yearId),
      this.lookup.firstSemesterOf(yearId),
    ])
    const yearName =
      timeline?.yearName ??
      (await this.lookup.listAcademicYears([yearId]))[0]?.name ??
      null
    const overdueAfter = overdueAfterOf(timeline?.endDate ?? null)
    const all = pairs.map((pair) => ({
      pair,
      row: this.toRow(pair, timeline?.startDate ?? null, overdueAfter, now),
    }))

    const rows = all
      .filter(({ pair, row }) => this.matches(pair, row, query))
      .map(({ row }) => row)
      .sort(compareByUrgency)
    const total = rows.length
    return {
      data: rows.slice((page - 1) * limit, page * limit),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        year: { id: yearId, name: yearName },
        datesMissing: [
          ...(timeline?.startDate ? [] : ['start' as const]),
          ...(timeline?.endDate ? [] : ['end' as const]),
        ],
        counts: {
          onTime: all.filter(
            ({ row }) => open(row) && row.urgency === 'ON_TIME',
          ).length,
          late: all.filter(({ row }) => open(row) && row.urgency === 'LATE')
            .length,
          overdue: all.filter(
            ({ row }) => open(row) && row.urgency === 'OVERDUE',
          ).length,
          complete: all.filter(({ row }) => row.state === 'APPROVED').length,
        },
      },
    }
  }

  private empty(page: number, limit: number) {
    return {
      data: [] as LateDocumentRow[],
      meta: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        year: null,
        datesMissing: [] as ('start' | 'end')[],
        counts: { onTime: 0, late: 0, overdue: 0, complete: 0 },
      },
    }
  }

  private toRow(
    pair: LateDocumentPair,
    startDate: Date | null,
    overdueAfter: Date | null,
    now: Date,
  ): LateDocumentRow {
    const limitDate = limitDateOf(startDate, pair.documentType.lateDueMonths)
    const { state, urgency } = deriveLateDocument({
      documentStatus: pair.document?.status ?? null,
      now,
      limitDate,
      overdueAfter,
    })
    return {
      applicationId: pair.applicationId,
      registrationNumber: pair.registrationNumber,
      applicantName: pair.applicantName,
      applicationStatus: pair.applicationStatus,
      waveName: pair.waveName,
      gradeLevel: pair.gradeLevel,
      documentTypeId: pair.documentType.id,
      documentTypeName: pair.documentType.name,
      documentId: pair.document?.id ?? null,
      fileId: pair.document?.fileId ?? null,
      fileName: pair.document?.fileName ?? null,
      fileMimeType: pair.document?.fileMimeType ?? null,
      state,
      urgency,
      limitDate,
      note: pair.document?.note ?? null,
    }
  }

  private matches(
    pair: LateDocumentPair,
    row: LateDocumentRow,
    query: LateDocumentQuery,
  ): boolean {
    const state = query.state ?? 'OPEN'
    if (
      state === 'OPEN' ? !OPEN_STATES.includes(row.state) : row.state !== state
    ) {
      return false
    }
    if (query.documentTypeId && row.documentTypeId !== query.documentTypeId)
      return false
    if (query.waveId && pair.waveId !== query.waveId) return false
    const search = query.search?.trim().toLowerCase()
    if (!search) return true
    return (
      row.applicantName.toLowerCase().includes(search) ||
      row.registrationNumber.toLowerCase().includes(search)
    )
  }
}

function open(row: LateDocumentRow): boolean {
  return row.state !== 'APPROVED'
}
