import { Injectable, NotFoundException } from '@nestjs/common'
import { IAdmissionDocumentReviewRepository } from '../../../domain/repositories/admission-document-review.repository.js'

@Injectable()
export class GetDocumentReviewUseCase {
  constructor(private readonly reviews: IAdmissionDocumentReviewRepository) {}

  async execute(applicationId: string) {
    const context = await this.reviews.findContext(applicationId)
    if (!context || context.status === 'DRAFT') {
      throw new NotFoundException('Pendaftar tidak ditemukan')
    }
    return { ...context, readOnly: context.status !== 'SUBMITTED' }
  }
}
