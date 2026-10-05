import { PrismaAdmissionApplicationRepository } from './prisma-admission-application.repository.js'
import type { PrismaService } from '../../../../../core/database/prisma.service.js'
import type { IAccountProvisioningPort } from '../../../../../platform/user/index.js'
import type { IReferenceLookupPort } from '../../../../../platform/reference-lookup/reference-lookup.port.js'

describe('PrismaAdmissionApplicationRepository stats', () => {
  const groupBy = jest.fn().mockResolvedValue([])
  const findMany = jest.fn().mockResolvedValue([])
  const repository = new PrismaAdmissionApplicationRepository(
    {
      admissionApplication: { groupBy },
      admissionWave: { findMany },
    } as unknown as PrismaService,
    {} as IAccountProvisioningPort,
    {} as IReferenceLookupPort,
  )

  beforeEach(() => jest.clearAllMocks())

  it('counts only applications whose wave belongs to the academic year', async () => {
    await repository.getStatusCounts({ academicYearId: 'year-1' })

    expect(groupBy.mock.calls[0][0].where).toEqual({
      deletedAt: null,
      wave: { academicYearId: 'year-1' },
    })
  })

  it('lists only waves of the academic year', async () => {
    await repository.getWavesWithAcceptedCount({ academicYearId: 'year-1' })

    expect(findMany.mock.calls[0][0].where).toEqual({
      deletedAt: null,
      academicYearId: 'year-1',
    })
  })

  it('still narrows to one wave', async () => {
    await repository.getStatusCounts({ waveId: 'wave-1' })
    await repository.getWavesWithAcceptedCount({ waveId: 'wave-1' })

    expect(groupBy.mock.calls[0][0].where).toEqual({
      deletedAt: null,
      waveId: 'wave-1',
    })
    expect(findMany.mock.calls[0][0].where).toEqual({
      deletedAt: null,
      id: 'wave-1',
    })
  })
})
