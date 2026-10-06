import { createDraftApplication } from './prisma-admission-applicant.draft.js'

function makeTx(quota: number, filled: number) {
  return {
    admissionWave: {
      update: jest
        .fn()
        .mockResolvedValue({ id: 'w1', quota, lastRegistrationSeq: 7 }),
    },
    admissionApplication: {
      groupBy: jest
        .fn()
        .mockResolvedValue(
          filled ? [{ waveId: 'w1', _count: { _all: filled } }] : [],
        ),
      create: jest.fn().mockResolvedValue({ id: 'app1' }),
    },
    admissionPayment: { create: jest.fn() },
    admissionNotification: { create: jest.fn() },
  }
}

const input = {
  waveId: 'w1',
  waveCode: 'G1',
  registrationFee: 100000,
  userId: 'u1',
  fullName: 'Budi',
  identifier: 'budi@example.com',
}

describe('createDraftApplication', () => {
  it('refuses a wave that filled up while the registration was in flight', async () => {
    const tx = makeTx(2, 2)

    await expect(createDraftApplication(tx as never, input)).rejects.toThrow(
      'Gelombang penuh',
    )
    expect(tx.admissionApplication.create).not.toHaveBeenCalled()
  })

  it('creates the draft while seats remain', async () => {
    const tx = makeTx(2, 1)

    await createDraftApplication(tx as never, input)

    expect(tx.admissionApplication.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ registrationNumber: 'G1-0007' }),
      }),
    )
  })
})
