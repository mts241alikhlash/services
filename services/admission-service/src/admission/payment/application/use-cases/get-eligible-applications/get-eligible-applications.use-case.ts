import { Injectable } from '@nestjs/common'
import { toNumericValue } from '../../../../../shared/domain/types/decimal.type.js'
import { IAdmissionPaymentQueueRepository } from '../../../domain/repositories/admission-payment-queue-repository.js'

const LIMIT = 20

@Injectable()
export class GetEligibleApplicationsUseCase {
  constructor(private readonly queue: IAdmissionPaymentQueueRepository) {}

  async execute(search?: string) {
    const rows = await this.queue.findEligibleApplications(search, LIMIT)
    return {
      data: rows.map((row) => ({ ...row, amount: toNumericValue(row.amount) })),
    }
  }
}
