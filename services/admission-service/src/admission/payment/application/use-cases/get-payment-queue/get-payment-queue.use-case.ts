import { Injectable } from '@nestjs/common'
import { toNumericValue } from '../../../../../shared/domain/types/decimal.type.js'
import {
  IAdmissionPaymentQueueRepository,
  type PaymentQueueStatus,
} from '../../../domain/repositories/admission-payment-queue-repository.js'

interface GetPaymentQueueInput {
  status?: PaymentQueueStatus
  search?: string
  waveId?: string
  page?: number
  limit?: number
}

@Injectable()
export class GetPaymentQueueUseCase {
  constructor(private readonly queue: IAdmissionPaymentQueueRepository) {}

  async execute(input: GetPaymentQueueInput) {
    const page = input.page ?? 1
    const limit = input.limit ?? 20
    const { rows, total, counts } = await this.queue.findQueue({
      status: input.status ?? 'PENDING',
      search: input.search,
      waveId: input.waveId,
      page,
      limit,
    })
    return {
      data: rows.map((row) => ({ ...row, amount: toNumericValue(row.amount) })),
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
