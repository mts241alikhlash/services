import { GetMyApplicationUseCase } from './get-my-application.use-case.js'

describe('GetMyApplicationUseCase', () => {
  const repo = {
    findMyDetail: jest.fn(),
    findActiveDocumentTypes: jest.fn(),
    isWaveFull: jest.fn(),
  }
  const getMyApplication = new GetMyApplicationUseCase(repo as never)

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
})
