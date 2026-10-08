import { Injectable } from '@nestjs/common'
import type { ReviewTab } from '../../../domain/entities/document-review.entity.js'
import { IAdmissionDocumentReviewRepository } from '../../../domain/repositories/admission-document-review.repository.js'
import { summarizeDocuments } from '../../../domain/policies/document-summary.policy.js'

interface GetDocumentReviewQueueInput {
  tab?: ReviewTab
  search?: string
  waveId?: string
  page?: number
  limit?: number
}

@Injectable()
export class GetDocumentReviewQueueUseCase {
  constructor(private readonly reviews: IAdmissionDocumentReviewRepository) {}

  async execute(input: GetDocumentReviewQueueInput) {
    const page = input.page ?? 1
    const limit = input.limit ?? 20
    const { records, total, counts, requiredTypeIds } =
      await this.reviews.findQueue({
        tab: input.tab ?? 'waiting',
        search: input.search,
        waveId: input.waveId,
        page,
        limit,
      })
    return {
      data: records.map((record) => ({
        applicationId: record.applicationId,
        registrationNumber: record.registrationNumber,
        applicantName: record.applicantName,
        waveName: record.waveName,
        status: record.status,
        submittedAt: record.submittedAt,
        summary: summarizeDocuments(requiredTypeIds, record.documents),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        counts,
      },
    }
  }
}
