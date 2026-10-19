import { PrismaAdmissionDocumentRepository } from './prisma-admission-document.repository.js'

it('resolves an upload code only to an active document type', async () => {
  const findFirst = jest.fn().mockResolvedValue(null)
  const repo = new PrismaAdmissionDocumentRepository({
    admissionDocumentType: { findFirst },
  } as never)

  await repo.findDocumentTypeByCode('RAPOR')

  expect(findFirst).toHaveBeenCalledWith({
    where: { code: 'RAPOR', isActive: true },
  })
})

it('lists only active REQUIRED types as required', async () => {
  const findMany = jest.fn().mockResolvedValue([])
  const repo = new PrismaAdmissionDocumentRepository({
    admissionDocumentType: { findMany },
  } as never)

  await repo.findRequiredActiveDocumentTypes()

  expect(findMany).toHaveBeenCalledWith({
    where: { isActive: true, requirement: 'REQUIRED' },
  })
})
