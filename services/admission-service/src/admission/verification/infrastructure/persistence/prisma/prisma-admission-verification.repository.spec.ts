import { PrismaAdmissionVerificationRepository } from './prisma-admission-verification.repository.js'

describe('PrismaAdmissionVerificationRepository', () => {
  it('lists the active required document type ids', async () => {
    const findMany = jest.fn().mockResolvedValue([{ id: 'kk' }, { id: 'akta' }])
    const repository = new PrismaAdmissionVerificationRepository({
      admissionDocumentType: { findMany },
    } as never)

    await expect(repository.findRequiredTypeIds()).resolves.toEqual([
      'kk',
      'akta',
    ])
    expect(findMany).toHaveBeenCalledWith({
      where: { isActive: true, isRequired: true },
      select: { id: true },
    })
  })

  it('reads the status, documents and payment status of a live application', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      status: 'SUBMITTED',
      documents: [{ documentTypeId: 'kk', status: 'APPROVED' }],
      payment: { status: 'VERIFIED' },
    })
    const repository = new PrismaAdmissionVerificationRepository({
      admissionApplication: { findFirst },
    } as never)

    await expect(repository.findSnapshot('app1')).resolves.toEqual({
      status: 'SUBMITTED',
      documents: [{ documentTypeId: 'kk', status: 'APPROVED' }],
      paymentStatus: 'VERIFIED',
    })
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'app1', deletedAt: null },
      select: {
        status: true,
        documents: { select: { documentTypeId: true, status: true } },
        payment: { select: { status: true } },
      },
    })
  })

  it('reports a missing payment as null and a missing application as null', async () => {
    const findFirst = jest
      .fn()
      .mockResolvedValueOnce({ status: 'SUBMITTED', documents: [], payment: null })
      .mockResolvedValueOnce(null)
    const repository = new PrismaAdmissionVerificationRepository({
      admissionApplication: { findFirst },
    } as never)

    await expect(repository.findSnapshot('a')).resolves.toMatchObject({
      paymentStatus: null,
    })
    await expect(repository.findSnapshot('b')).resolves.toBeNull()
  })

  it('verifies only while every condition still holds, in one statement', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 })
    const repository = new PrismaAdmissionVerificationRepository({
      admissionApplication: { updateMany },
    } as never)

    await expect(
      repository.markVerified('app1', 'admin1', ['kk', 'akta']),
    ).resolves.toBe(true)

    const call = updateMany.mock.calls[0][0] as {
      where: Record<string, unknown>
      data: Record<string, unknown>
    }
    expect(call.where).toEqual({
      id: 'app1',
      deletedAt: null,
      status: 'SUBMITTED',
      payment: { is: { status: 'VERIFIED' } },
      AND: [
        { documents: { some: { documentTypeId: 'kk', status: 'APPROVED' } } },
        { documents: { some: { documentTypeId: 'akta', status: 'APPROVED' } } },
      ],
    })
    expect(call.data).toMatchObject({
      status: 'VERIFIED',
      verifiedById: 'admin1',
    })
    expect(call.data.verifiedAt).toBeInstanceOf(Date)
  })

  it('answers false when another request got there first', async () => {
    const repository = new PrismaAdmissionVerificationRepository({
      admissionApplication: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    } as never)

    await expect(
      repository.markVerified('app1', null, []),
    ).resolves.toBe(false)
  })
})
