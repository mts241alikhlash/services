import { PrismaLateDocumentRepository } from './prisma-late-document.repository.js'

function build(overrides: Record<string, unknown> = {}) {
  const prisma = {
    admissionWave: { findFirst: jest.fn() },
    admissionDocumentType: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'ijazah', code: 'IJAZAH', name: 'Ijazah SD', lateDueMonths: 2 },
        { id: 'rapor', code: 'RAPOR', name: 'Rapor', lateDueMonths: null },
      ]),
      findFirst: jest.fn(),
    },
    admissionApplication: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'app1',
          registrationNumber: 'PSB-001',
          fullName: 'Ahmad',
          status: 'ENROLLED',
          targetGradeLevel: 7,
          wave: { id: 'w1', name: 'Gelombang 1' },
          documents: [
            {
              id: 'd1',
              documentTypeId: 'ijazah',
              fileId: 'f1',
              status: 'PENDING',
              note: null,
            },
          ],
        },
      ]),
      findFirst: jest.fn(),
    },
    ...overrides,
  }
  return {
    prisma,
    repository: new PrismaLateDocumentRepository(prisma as never),
  }
}

describe('PrismaLateDocumentRepository.resolvePpdbYearId', () => {
  it('uses the year of the latest active wave', async () => {
    const { repository, prisma } = build()
    prisma.admissionWave.findFirst.mockResolvedValueOnce({
      academicYearId: 'y2027',
    })

    await expect(repository.resolvePpdbYearId()).resolves.toBe('y2027')
    expect(prisma.admissionWave.findFirst).toHaveBeenCalledWith({
      where: { isActive: true, deletedAt: null },
      orderBy: { startDate: 'desc' },
      select: { academicYearId: true },
    })
  })

  it('falls back to the year of the latest wave when none is active', async () => {
    const { repository, prisma } = build()
    prisma.admissionWave.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ academicYearId: 'y2026' })

    await expect(repository.resolvePpdbYearId()).resolves.toBe('y2026')
    expect(prisma.admissionWave.findFirst).toHaveBeenLastCalledWith({
      where: { deletedAt: null },
      orderBy: { startDate: 'desc' },
      select: { academicYearId: true },
    })
  })

  it('answers null when there is no wave at all', async () => {
    const { repository, prisma } = build()
    prisma.admissionWave.findFirst.mockResolvedValue(null)

    await expect(repository.resolvePpdbYearId()).resolves.toBeNull()
  })
})

describe('PrismaLateDocumentRepository.findTrackedPairs', () => {
  it('asks for tracked applications of the year and active LATER types only', async () => {
    const { repository, prisma } = build()

    await repository.findTrackedPairs('y1')

    expect(prisma.admissionDocumentType.findMany).toHaveBeenCalledWith({
      where: { isActive: true, requirement: 'LATER' },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, code: true, name: true, lateDueMonths: true },
    })
    const call = prisma.admissionApplication.findMany.mock.calls[0][0] as {
      where: unknown
    }
    expect(call.where).toEqual({
      deletedAt: null,
      status: {
        in: [
          'SUBMITTED',
          'REVISION_NEEDED',
          'VERIFIED',
          'ACCEPTED',
          'ENROLLING',
          'ENROLLED',
        ],
      },
      wave: { academicYearId: 'y1' },
    })
  })

  it('makes a pair for every application and type, with the document or null', async () => {
    const { repository } = build()

    const pairs = await repository.findTrackedPairs('y1')

    expect(pairs).toHaveLength(2)
    expect(pairs[0]).toMatchObject({
      applicationId: 'app1',
      registrationNumber: 'PSB-001',
      applicantName: 'Ahmad',
      waveName: 'Gelombang 1',
      gradeLevel: 7,
      documentType: { id: 'ijazah', lateDueMonths: 2 },
      document: { id: 'd1', status: 'PENDING' },
    })
    expect(pairs[1]).toMatchObject({
      documentType: { id: 'rapor' },
      document: null,
    })
  })

  it('answers no pairs when no type is LATER', async () => {
    const { repository, prisma } = build()
    prisma.admissionDocumentType.findMany.mockResolvedValue([])

    await expect(repository.findTrackedPairs('y1')).resolves.toEqual([])
    expect(prisma.admissionApplication.findMany).not.toHaveBeenCalled()
  })
})

describe('PrismaLateDocumentRepository.findPair', () => {
  it('answers null for an unknown application or a type that is not an active LATER type', async () => {
    const { repository, prisma } = build()
    prisma.admissionDocumentType.findFirst.mockResolvedValue(null)

    await expect(repository.findPair('app1', 'ijazah')).resolves.toBeNull()
    expect(prisma.admissionDocumentType.findFirst).toHaveBeenCalledWith({
      where: { id: 'ijazah', isActive: true, requirement: 'LATER' },
      select: { id: true, code: true, name: true, lateDueMonths: true },
    })
  })

  it('returns the pair of an application and a LATER type', async () => {
    const { repository, prisma } = build()
    prisma.admissionDocumentType.findFirst.mockResolvedValue({
      id: 'ijazah',
      code: 'IJAZAH',
      name: 'Ijazah SD',
      lateDueMonths: 2,
    })
    prisma.admissionApplication.findFirst.mockResolvedValue({
      id: 'app1',
      registrationNumber: 'PSB-001',
      fullName: 'Ahmad',
      status: 'ENROLLED',
      targetGradeLevel: 7,
      wave: { id: 'w1', name: 'Gelombang 1' },
      documents: [],
    })

    await expect(repository.findPair('app1', 'ijazah')).resolves.toMatchObject({
      applicationId: 'app1',
      applicationStatus: 'ENROLLED',
      document: null,
    })
  })
})
