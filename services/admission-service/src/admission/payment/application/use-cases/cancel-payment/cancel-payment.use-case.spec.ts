import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { CancelPaymentUseCase } from './cancel-payment.use-case.js'

function setup(outcome: Record<string, unknown> | null = null) {
  const payments = {
    findPayment: jest.fn().mockResolvedValue({ id: 'pay1' }),
    cancelVerification: jest.fn().mockResolvedValue(
      outcome ?? {
        outcome: 'CANCELLED',
        payment: { id: 'pay1', status: 'PENDING', amount: 150000 },
        applicationReopened: true,
      },
    ),
  }
  const notifications = { notify: jest.fn() }
  const useCase = new CancelPaymentUseCase(payments as never, notifications)
  return { payments, notifications, useCase }
}

describe('CancelPaymentUseCase', () => {
  it('cancels, tells the applicant and returns the payment', async () => {
    const { payments, notifications, useCase } = setup()

    const result = await useCase.execute({
      applicationId: 'app1',
      note: '  Nominal salah ',
    })

    expect(payments.cancelVerification).toHaveBeenCalledWith({
      applicationId: 'app1',
      paymentId: 'pay1',
      note: 'Nominal salah',
    })
    expect(notifications.notify).toHaveBeenCalledWith(
      'app1',
      'PAYMENT',
      'Verifikasi pembayaran dibatalkan',
      expect.stringContaining('Nominal salah'),
    )
    expect(result).toMatchObject({
      id: 'pay1',
      status: 'PENDING',
      amount: 150000,
    })
  })

  it.each([undefined, '', '   '])('requires a reason: %j', async (note) => {
    const { payments, useCase } = setup()

    await expect(
      useCase.execute({ applicationId: 'app1', note }),
    ).rejects.toThrow(new BadRequestException('Alasan pembatalan wajib diisi'))
    expect(payments.cancelVerification).not.toHaveBeenCalled()
  })

  it('answers 404 when there is no payment', async () => {
    const { payments, useCase } = setup()
    payments.findPayment.mockResolvedValue(null)

    await expect(
      useCase.execute({ applicationId: 'app1', note: 'x' }),
    ).rejects.toThrow(new NotFoundException('Data pembayaran tidak ditemukan'))
  })

  it('answers 409 when the payment is not verified', async () => {
    const { notifications, useCase } = setup({ outcome: 'NOT_VERIFIED' })

    await expect(
      useCase.execute({ applicationId: 'app1', note: 'x' }),
    ).rejects.toThrow(new ConflictException('Pembayaran belum diverifikasi'))
    expect(notifications.notify).not.toHaveBeenCalled()
  })

  it('answers 409 once the application is decided', async () => {
    const { notifications, useCase } = setup({ outcome: 'DECIDED' })

    await expect(
      useCase.execute({ applicationId: 'app1', note: 'x' }),
    ).rejects.toThrow(
      new ConflictException(
        'Pembayaran tidak bisa dibatalkan setelah pendaftaran diputuskan',
      ),
    )
    expect(notifications.notify).not.toHaveBeenCalled()
  })
})
