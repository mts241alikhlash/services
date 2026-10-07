import { GetEligibleApplicationsUseCase } from './get-eligible-applications/get-eligible-applications.use-case.js'
import { GetPaymentQueueUseCase } from './get-payment-queue/get-payment-queue.use-case.js'

const row = {
  paymentId: 'pay1',
  applicationId: 'app1',
  amount: 150000,
}

describe('GetPaymentQueueUseCase', () => {
  it('pages the queue and reports the tab counts', async () => {
    const queue = {
      findQueue: jest.fn().mockResolvedValue({
        rows: [row],
        total: 45,
        counts: { pending: 45, verified: 3, rejected: 1 },
      }),
    }

    const result = await new GetPaymentQueueUseCase(queue as never).execute({
      status: 'PENDING',
      page: 2,
      limit: 20,
    })

    expect(queue.findQueue).toHaveBeenCalledWith({
      status: 'PENDING',
      search: undefined,
      waveId: undefined,
      page: 2,
      limit: 20,
    })
    expect(result).toEqual({
      data: [row],
      meta: {
        page: 2,
        limit: 20,
        total: 45,
        totalPages: 3,
        counts: { pending: 45, verified: 3, rejected: 1 },
      },
    })
  })

  it('defaults to the pending tab and the first page', async () => {
    const queue = {
      findQueue: jest.fn().mockResolvedValue({
        rows: [],
        total: 0,
        counts: { pending: 0, verified: 0, rejected: 0 },
      }),
    }

    await new GetPaymentQueueUseCase(queue as never).execute({})

    expect(queue.findQueue).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PENDING', page: 1, limit: 20 }),
    )
  })
})

describe('GetEligibleApplicationsUseCase', () => {
  it('serializes the amount and limits the list to twenty', async () => {
    const queue = {
      findEligibleApplications: jest
        .fn()
        .mockResolvedValue([{ applicationId: 'app1', amount: 150000 }]),
    }

    const result = await new GetEligibleApplicationsUseCase(
      queue as never,
    ).execute('ahmad')

    expect(queue.findEligibleApplications).toHaveBeenCalledWith('ahmad', 20)
    expect(result).toEqual({
      data: [{ applicationId: 'app1', amount: 150000 }],
    })
  })
})
