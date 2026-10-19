import { GetMyApplicationUseCase } from './get-my-application.use-case.js'

describe('GetMyApplicationUseCase', () => {
  const repo = {
    findMyDetail: jest.fn(),
    findActiveDocumentTypes: jest.fn(),
    isWaveFull: jest.fn(),
  }
  const lookup = { firstSemesterOf: jest.fn().mockResolvedValue(null) }
  const getMyApplication = new GetMyApplicationUseCase(
    repo as never,
    lookup as never,
  )

  it('flags an unverified applicant whose wave is full', async () => {
    repo.findMyDetail.mockResolvedValue({
      id: 'app1',
      waveId: 'w1',
      payment: { status: 'PENDING', amount: 100000 },
    })
    repo.findActiveDocumentTypes.mockResolvedValue([])
    repo.isWaveFull.mockResolvedValue(true)

    const result = await getMyApplication.execute('u1')

    expect(result.waveIsFull).toBe(true)
  })

  it('does not flag a verified applicant', async () => {
    repo.findMyDetail.mockResolvedValue({
      id: 'app1',
      waveId: 'w1',
      payment: { status: 'VERIFIED', amount: 100000 },
    })
    repo.findActiveDocumentTypes.mockResolvedValue([])
    repo.isWaveFull.mockResolvedValue(true)

    const result = await getMyApplication.execute('u1')

    expect(result.waveIsFull).toBe(false)
  })

  it('adds the due date of a LATER type from the year of the wave', async () => {
    repo.findMyDetail.mockResolvedValue({
      id: 'app1',
      waveId: 'w1',
      wave: { academicYearId: 'y1' },
      payment: { status: 'VERIFIED', amount: 100000 },
    })
    repo.findActiveDocumentTypes.mockResolvedValue([
      { id: 'kk', requirement: 'REQUIRED', lateDueMonths: null },
      { id: 'ijazah', requirement: 'LATER', lateDueMonths: 2 },
    ])
    lookup.firstSemesterOf.mockResolvedValue({
      yearId: 'y1',
      yearName: '2027/2028',
      startDate: new Date('2026-07-13'),
      endDate: new Date('2026-12-19'),
    })

    const result = await getMyApplication.execute('u1')

    expect(lookup.firstSemesterOf).toHaveBeenCalledWith('y1')
    expect(result.documentTypes.map((type) => type.dueDate)).toEqual([
      null,
      '2026-09-13T16:59:59.999Z',
    ])
  })
})
