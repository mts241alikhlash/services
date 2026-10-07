import { BadRequestException, ConflictException } from '@nestjs/common'
import { AdmissionPaymentStatus } from '../../../../../shared/domain/enums/admission-payment-status.enum.js'
import { AddPaymentUseCase } from './add-payment.use-case.js'

const file = {
  buffer: Buffer.from('x'),
  originalname: 'bukti.png',
  mimetype: 'image/png',
  size: 1,
}

const input = {
  applicationId: 'app1',
  bankName: 'BSI',
  bankAccountId: 'acc1',
  senderAccountName: 'Ahmad Fauzi',
  transferDate: new Date('2026-10-01'),
  file,
  adminId: 'treasurer1',
}

function setup() {
  const order: string[] = []
  const upload = {
    executeForApplication: jest.fn(() => {
      order.push('upload')
      return Promise.resolve({ id: 'pay1', status: 'PENDING' })
    }),
  }
  const verify = {
    execute: jest.fn(() => {
      order.push('verify')
      return Promise.resolve({ id: 'pay1', status: 'VERIFIED' })
    }),
  }
  const useCase = new AddPaymentUseCase(upload as never, verify as never)
  return { upload, verify, order, useCase }
}

describe('AddPaymentUseCase', () => {
  it('uploads the proof for the applicant and then verifies it as the treasurer', async () => {
    const { upload, verify, order, useCase } = setup()

    const result = await useCase.execute(input)

    expect(order).toEqual(['upload', 'verify'])
    expect(upload.executeForApplication).toHaveBeenCalledWith(input)
    expect(verify.execute).toHaveBeenCalledWith({
      applicationId: 'app1',
      status: AdmissionPaymentStatus.VERIFIED,
      adminId: 'treasurer1',
    })
    expect(result).toEqual({ id: 'pay1', status: 'VERIFIED' })
  })

  it('requires the proof file', async () => {
    const { upload, verify, useCase } = setup()

    await expect(
      useCase.execute({ ...input, file: undefined as never }),
    ).rejects.toThrow(
      new BadRequestException('Bukti pembayaran wajib diunggah'),
    )
    expect(upload.executeForApplication).not.toHaveBeenCalled()
    expect(verify.execute).not.toHaveBeenCalled()
  })

  it('does not verify when the upload is refused', async () => {
    const { upload, verify, useCase } = setup()
    upload.executeForApplication.mockRejectedValue(
      new ConflictException('Pembayaran sudah diverifikasi'),
    )

    await expect(useCase.execute(input)).rejects.toThrow(ConflictException)
    expect(verify.execute).not.toHaveBeenCalled()
  })

  it('leaves the uploaded payment pending when the verification is refused', async () => {
    const { upload, verify, useCase } = setup()
    verify.execute.mockRejectedValue(new ConflictException('Gelombang penuh'))

    await expect(useCase.execute(input)).rejects.toThrow(
      new ConflictException('Gelombang penuh'),
    )
    expect(upload.executeForApplication).toHaveBeenCalledTimes(1)
  })
})
