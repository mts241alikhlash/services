import { GetActiveWavesUseCase } from './get-active-waves.use-case.js'

describe('GetActiveWavesUseCase', () => {
  const applicantRepo = {
    findActiveWaves: jest.fn(),
    findActiveDocumentTypes: jest.fn(),
  }
  const getActiveWaves = new GetActiveWavesUseCase(applicantRepo as never)

  it('reports remaining quota from filled seats', async () => {
    applicantRepo.findActiveWaves.mockResolvedValue([
      {
        id: 'w1',
        name: 'G1',
        code: 'G1',
        academicYear: null,
        startDate: new Date('2027-01-01'),
        endDate: new Date('2027-02-01'),
        quota: 10,
        filledCount: 4,
        _count: { applications: 9 },
        registrationFee: 100000,
        description: null,
      },
    ])
    applicantRepo.findActiveDocumentTypes.mockResolvedValue([])

    const result = await getActiveWaves.execute()

    expect(result.waves[0].remainingQuota).toBe(6)
  })
})
