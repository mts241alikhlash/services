import { ConflictException } from '@nestjs/common'
import { PrismaAdmissionApplicationRepository } from './prisma-admission-application.repository.js'

function setup(count: number) {
  const admissionApplication = {
    updateMany: jest.fn().mockResolvedValue({ count }),
    findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'app1' }),
  }
  const repo = new PrismaAdmissionApplicationRepository(
    { admissionApplication } as never,
    {} as never,
    {} as never,
  )
  jest
    .spyOn(
      repo as unknown as { attachAccountSummary: (row: unknown) => unknown },
      'attachAccountSummary',
    )
    .mockImplementation((row: unknown) => Promise.resolve(row))
  return { repo, admissionApplication }
}

describe('setEnrolling after a concurrent cancelled acceptance', () => {
  it('moves only an application that is still accepted', async () => {
    const { repo, admissionApplication } = setup(1)

    await repo.setEnrolling('app1')

    expect(admissionApplication.updateMany).toHaveBeenCalledWith({
      where: { id: 'app1', status: 'ACCEPTED' },
      data: { status: 'ENROLLING' },
    })
  })

  it('refuses when the acceptance was cancelled first', async () => {
    const { repo } = setup(0)

    await expect(repo.setEnrolling('app1')).rejects.toBeInstanceOf(
      ConflictException,
    )
  })
})
