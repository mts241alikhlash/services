import { PrismaAdmissionApplicationRepository } from './prisma-admission-application.repository.js'

it('reads active types plus inactive ones the application uploaded', async () => {
  const findMany = jest.fn().mockResolvedValue([])
  const repo = new PrismaAdmissionApplicationRepository(
    { admissionDocumentType: { findMany } } as never,
    {} as never,
    {} as never,
  )

  await repo.findDocumentTypesForReview('app1')

  expect(findMany).toHaveBeenCalledWith({
    where: {
      OR: [
        { isActive: true },
        { documents: { some: { applicationId: 'app1' } } },
      ],
    },
    orderBy: { sortOrder: 'asc' },
  })
})

it('asks only for active REQUIRED types when checking readiness', async () => {
  const findMany = jest.fn().mockResolvedValue([])
  const repo = new PrismaAdmissionApplicationRepository(
    { admissionDocumentType: { findMany } } as never,
    {} as never,
    {} as never,
  )

  await repo.findRequiredActiveDocumentTypes()

  expect(findMany).toHaveBeenCalledWith({
    where: { isActive: true, requirement: 'REQUIRED' },
  })
})
