import { PrismaAdmissionFileRepository } from './prisma-admission-file.repository.js'

describe('PrismaAdmissionFileRepository.findServable', () => {
  it('only offers a live file that an admission record owns', async () => {
    const found = {
      id: 'f1',
      originalName: 'kk.pdf',
      mimeType: 'application/pdf',
      storageKey: 'production/admission/documents/kk.pdf',
    }
    const findFirst = jest.fn().mockResolvedValue(found)
    const repository = new PrismaAdmissionFileRepository({
      file: { findFirst },
    } as never)

    await expect(repository.findServable('f1')).resolves.toEqual(found)

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'f1',
        deletedAt: null,
        OR: [
          { admissionDocuments: { some: {} } },
          { admissionPaymentProofs: { some: {} } },
          { admissionAchievements: { some: {} } },
          { admissionScholarships: { some: {} } },
          { applicationId: { not: null } },
        ],
      },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        storageKey: true,
      },
    })
  })

  it('answers null for a file nothing refers to', async () => {
    const repository = new PrismaAdmissionFileRepository({
      file: { findFirst: jest.fn().mockResolvedValue(null) },
    } as never)

    await expect(repository.findServable('other')).resolves.toBeNull()
  })
})
