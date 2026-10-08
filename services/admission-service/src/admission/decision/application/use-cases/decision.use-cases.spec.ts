import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { AcceptManyUseCase } from './accept-many/accept-many.use-case.js'
import { CancelAcceptanceUseCase } from './cancel-acceptance/cancel-acceptance.use-case.js'
import { CancelRejectionUseCase } from './cancel-rejection/cancel-rejection.use-case.js'
import { GetDecisionQueueUseCase } from './get-decision-queue/get-decision-queue.use-case.js'
import { RejectFromQueueUseCase } from './reject-from-queue/reject-from-queue.use-case.js'

describe('GetDecisionQueueUseCase', () => {
  it('defaults to Menunggu keputusan, summarises the documents and pages the meta', async () => {
    const findQueue = jest.fn().mockResolvedValue({
      records: [
        {
          applicationId: 'app1',
          registrationNumber: 'PSB-001',
          applicantName: 'Ahmad',
          waveName: 'Gelombang 1',
          status: 'VERIFIED',
          submittedAt: null,
          verifiedAt: new Date('2026-10-02T00:00:00Z'),
          decidedAt: null,
          decisionNote: null,
          paymentStatus: 'VERIFIED',
          documents: [{ documentTypeId: 'kk', status: 'APPROVED' }],
        },
      ],
      total: 41,
      counts: { waiting: 41, accepted: 2, rejected: 1 },
      requiredTypeIds: ['kk'],
    })

    const result = await new GetDecisionQueueUseCase({
      findQueue,
    } as never).execute({})

    expect(findQueue).toHaveBeenCalledWith({
      tab: 'waiting',
      search: undefined,
      waveId: undefined,
      page: 1,
      limit: 20,
    })
    expect(result.data[0].summary).toEqual({
      approved: 1,
      rejected: 0,
      pending: 0,
      missing: 0,
      total: 1,
    })
    expect(result.meta).toEqual({
      page: 1,
      limit: 20,
      total: 41,
      totalPages: 3,
      counts: { waiting: 41, accepted: 2, rejected: 1 },
    })
  })
})

describe('RejectFromQueueUseCase', () => {
  it('rejects a verified applicant with a trimmed reason', async () => {
    const decisions = {
      findStatus: jest.fn().mockResolvedValue({ status: 'VERIFIED' }),
    }
    const reject = {
      execute: jest.fn().mockResolvedValue({ id: 'app1', status: 'REJECTED' }),
    }

    const result = await new RejectFromQueueUseCase(
      decisions as never,
      reject as never,
    ).execute({
      applicationId: 'app1',
      reason: ' Kuota penuh ',
      adminId: 'admin1',
    })

    expect(reject.execute).toHaveBeenCalledWith(
      'app1',
      { reason: 'Kuota penuh', onlyVerified: true },
      'admin1',
    )
    expect(result).toEqual({ id: 'app1', status: 'REJECTED' })
  })

  it('needs a reason', async () => {
    const reject = { execute: jest.fn() }

    await expect(
      new RejectFromQueueUseCase(
        { findStatus: jest.fn() } as never,
        reject as never,
      ).execute({
        applicationId: 'app1',
        reason: '  ',
        adminId: 'admin1',
      }),
    ).rejects.toThrow(new BadRequestException('Alasan penolakan wajib diisi'))
    expect(reject.execute).not.toHaveBeenCalled()
  })

  it.each(['SUBMITTED', 'ACCEPTED', 'REJECTED', 'ENROLLED'])(
    'leaves a %s applicant to the detail page',
    async (status) => {
      const reject = { execute: jest.fn() }

      await expect(
        new RejectFromQueueUseCase(
          { findStatus: jest.fn().mockResolvedValue({ status }) } as never,
          reject as never,
        ).execute({ applicationId: 'app1', reason: 'x', adminId: 'admin1' }),
      ).rejects.toThrow(
        new ConflictException(
          'Hanya pendaftar terverifikasi yang bisa diputuskan di sini',
        ),
      )
      expect(reject.execute).not.toHaveBeenCalled()
    },
  )

  it('answers 404 for an unknown applicant', async () => {
    await expect(
      new RejectFromQueueUseCase(
        { findStatus: jest.fn().mockResolvedValue(null) } as never,
        { execute: jest.fn() } as never,
      ).execute({ applicationId: 'x', reason: 'x', adminId: 'admin1' }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe('AcceptManyUseCase', () => {
  it('accepts each applicant once and reports what happened to every id', async () => {
    const accept = {
      execute: jest
        .fn()
        .mockResolvedValueOnce({ id: 'a' })
        .mockRejectedValueOnce(
          new ConflictException(
            'Invalid status transition: ACCEPTED → ACCEPTED',
          ),
        )
        .mockRejectedValueOnce(new NotFoundException('Application not found'))
        .mockRejectedValueOnce(new Error('smtp down')),
    }

    const result = await new AcceptManyUseCase(accept as never).execute({
      applicationIds: ['a', 'b', 'c', 'd', 'a'],
      note: 'Selamat',
      adminId: 'admin1',
    })

    expect(accept.execute).toHaveBeenCalledTimes(4)
    expect(accept.execute).toHaveBeenNthCalledWith(
      1,
      'a',
      { note: 'Selamat' },
      'admin1',
    )
    expect(result.results).toEqual([
      { applicationId: 'a', outcome: 'ACCEPTED' },
      {
        applicationId: 'b',
        outcome: 'SKIPPED',
        reason: 'Status pendaftar sudah berubah',
      },
      {
        applicationId: 'c',
        outcome: 'SKIPPED',
        reason: 'Pendaftar tidak ditemukan',
      },
      {
        applicationId: 'd',
        outcome: 'SKIPPED',
        reason: 'Gagal memproses, coba lagi',
      },
    ])
  })

  it('passes no note when none is given', async () => {
    const accept = { execute: jest.fn().mockResolvedValue({ id: 'a' }) }

    await new AcceptManyUseCase(accept as never).execute({
      applicationIds: ['a'],
      adminId: 'admin1',
    })

    expect(accept.execute).toHaveBeenCalledWith(
      'a',
      { note: undefined },
      'admin1',
    )
  })

  it.each([[0], [51]])('refuses %i ids', async (size) => {
    const accept = { execute: jest.fn() }

    await expect(
      new AcceptManyUseCase(accept as never).execute({
        applicationIds: Array.from(
          { length: size },
          (_, index) => `id${index}`,
        ),
        adminId: 'admin1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(accept.execute).not.toHaveBeenCalled()
  })
})

describe('CancelAcceptanceUseCase', () => {
  function setup(status: string | null, cancelled = true) {
    const decisions = {
      findStatus: jest.fn().mockResolvedValue(status ? { status } : null),
      cancelAcceptance: jest.fn().mockResolvedValue(cancelled),
    }
    const notifications = { notify: jest.fn().mockResolvedValue(undefined) }
    return {
      decisions,
      notifications,
      useCase: new CancelAcceptanceUseCase(
        decisions as never,
        notifications as never,
      ),
    }
  }
  const input = {
    applicationId: 'app1',
    reason: ' Salah klik ',
    adminId: 'admin1',
  }

  it('returns the applicant to the queue and tells them once', async () => {
    const { useCase, decisions, notifications } = setup('ACCEPTED')

    await expect(useCase.execute(input)).resolves.toEqual({
      applicationId: 'app1',
      status: 'VERIFIED',
    })
    expect(decisions.cancelAcceptance).toHaveBeenCalledWith('app1')
    expect(notifications.notify).toHaveBeenCalledTimes(1)
    expect(notifications.notify).toHaveBeenCalledWith(
      'app1',
      'STATUS_CHANGE',
      'Keputusan penerimaan ditinjau ulang',
      expect.stringContaining('Salah klik'),
    )
  })

  it('needs a reason', async () => {
    const { useCase, decisions } = setup('ACCEPTED')

    await expect(useCase.execute({ ...input, reason: ' ' })).rejects.toThrow(
      new BadRequestException('Alasan pembatalan wajib diisi'),
    )
    expect(decisions.cancelAcceptance).not.toHaveBeenCalled()
  })

  it.each(['ENROLLING', 'ENROLLED'])(
    'refuses once the applicant is %s',
    async (status) => {
      const { useCase, decisions, notifications } = setup(status)

      await expect(useCase.execute(input)).rejects.toThrow(
        new ConflictException(
          'Penerimaan tidak bisa dibatalkan setelah proses daftar ulang dimulai',
        ),
      )
      expect(decisions.cancelAcceptance).not.toHaveBeenCalled()
      expect(notifications.notify).not.toHaveBeenCalled()
    },
  )

  it.each(['VERIFIED', 'REJECTED', 'SUBMITTED'])(
    'refuses a %s applicant',
    async (status) => {
      await expect(setup(status).useCase.execute(input)).rejects.toThrow(
        new ConflictException('Pendaftar tidak sedang berstatus diterima'),
      )
    },
  )

  it('answers 404 for an unknown applicant', async () => {
    await expect(setup(null).useCase.execute(input)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it('does not notify when another request changed the status first', async () => {
    const { useCase, notifications } = setup('ACCEPTED', false)

    await expect(useCase.execute(input)).rejects.toThrow(
      new ConflictException(
        'Pendaftaran berubah saat Anda bekerja, muat ulang dan coba lagi',
      ),
    )
    expect(notifications.notify).not.toHaveBeenCalled()
  })
})

describe('CancelRejectionUseCase', () => {
  function setup(status: string | null, verified = false, cancelled = true) {
    const decisions = {
      findStatus: jest.fn().mockResolvedValue(status ? { status } : null),
      cancelRejection: jest.fn().mockResolvedValue(cancelled),
    }
    const notifications = { notify: jest.fn().mockResolvedValue(undefined) }
    const verifyWhenReady = { execute: jest.fn().mockResolvedValue(verified) }
    return {
      decisions,
      notifications,
      verifyWhenReady,
      useCase: new CancelRejectionUseCase(
        decisions as never,
        notifications as never,
        verifyWhenReady as never,
      ),
    }
  }
  const input = {
    applicationId: 'app1',
    reason: 'Banding diterima',
    adminId: 'admin1',
  }

  it('sends the applicant back to review, tells them once and verifies when ready', async () => {
    const { useCase, notifications, verifyWhenReady } = setup('REJECTED', true)

    await expect(useCase.execute(input)).resolves.toEqual({
      applicationId: 'app1',
      status: 'VERIFIED',
      verified: true,
    })
    expect(notifications.notify).toHaveBeenCalledTimes(1)
    expect(notifications.notify).toHaveBeenCalledWith(
      'app1',
      'STATUS_CHANGE',
      'Keputusan penolakan ditinjau ulang',
      expect.stringContaining('Banding diterima'),
    )
    expect(verifyWhenReady.execute).toHaveBeenCalledWith('app1', 'admin1')
  })

  it('leaves an incomplete applicant in review', async () => {
    const { useCase } = setup('REJECTED', false)

    await expect(useCase.execute(input)).resolves.toEqual({
      applicationId: 'app1',
      status: 'SUBMITTED',
      verified: false,
    })
  })

  it('needs a reason and a rejected applicant', async () => {
    await expect(
      setup('REJECTED').useCase.execute({ ...input, reason: '' }),
    ).rejects.toBeInstanceOf(BadRequestException)
    await expect(setup('ACCEPTED').useCase.execute(input)).rejects.toThrow(
      new ConflictException('Pendaftar tidak sedang berstatus ditolak'),
    )
    await expect(setup(null).useCase.execute(input)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it('does not notify or verify when another request changed the status first', async () => {
    const { useCase, notifications, verifyWhenReady } = setup(
      'REJECTED',
      false,
      false,
    )

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      ConflictException,
    )
    expect(notifications.notify).not.toHaveBeenCalled()
    expect(verifyWhenReady.execute).not.toHaveBeenCalled()
  })
})
