import { Prisma } from '@prisma/client'
import { PrismaStudentRepository } from './prisma-student.repository.js'

describe('PrismaStudentRepository.enrolExistingAccount', () => {
  function uniqueViolation(target: string[]) {
    return new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: '7.9.1', meta: { target } },
    )
  }

  it('returns the committed student when the user create race loses', async () => {
    const transaction = {
      student: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockRejectedValue(uniqueViolation(['user_id'])),
      },
    }
    const prisma = {
      $transaction: jest
        .fn()
        .mockImplementation((callback: (tx: typeof transaction) => unknown) =>
          callback(transaction),
        ),
      student: {
        findFirst: jest.fn().mockResolvedValue({ id: 'student-1' }),
      },
    }
    const repository = new PrismaStudentRepository(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
    )

    await expect(
      repository.enrolExistingAccount({
        applicationId: 'application-1',
        userId: 'user-1',
        nis: '2026001',
        nisn: '0101234567',
      }),
    ).resolves.toEqual({
      studentId: 'student-1',
      parentsLinked: 0,
      enrollmentCreated: false,
      alreadyEnrolled: true,
    })
  })

  it('rethrows a unique conflict when no student won the race', async () => {
    const error = uniqueViolation(['students_nis_key'])
    const transaction = {
      student: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockRejectedValue(error),
      },
    }
    const prisma = {
      $transaction: jest
        .fn()
        .mockImplementation((callback: (tx: typeof transaction) => unknown) =>
          callback(transaction),
        ),
      student: { findFirst: jest.fn().mockResolvedValue(null) },
    }
    const repository = new PrismaStudentRepository(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
    )

    await expect(
      repository.enrolExistingAccount({
        userId: 'user-1',
        nis: '2026001',
        nisn: '0101234567',
      }),
    ).rejects.toBe(error)
  })
})
