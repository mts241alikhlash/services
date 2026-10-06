import { EnsureMyApplicationUseCase } from './ensure-my-application.use-case.js'

describe('EnsureMyApplicationUseCase waveIsFull', () => {
  const repo = {
    findMyDetail: jest.fn(),
    findActiveDocumentTypes: jest.fn().mockResolvedValue([]),
    findActiveWave: jest.fn(),
    ensureApplication: jest.fn(),
    isWaveFull: jest.fn(),
  }
  const ensure = new EnsureMyApplicationUseCase(repo as never)

  beforeEach(() => jest.clearAllMocks())

  it('flags an existing unverified application whose wave is full', async () => {
    repo.findMyDetail.mockResolvedValue({
      id: 'app1',
      waveId: 'w1',
      payment: { status: 'PENDING', amount: 100000 },
    })
    repo.isWaveFull.mockResolvedValue(true)

    const result = await ensure.execute({ userId: 'u1' })

    expect(result.waveIsFull).toBe(true)
  })

  it('never flags an application it just created in an open wave', async () => {
    repo.findMyDetail.mockResolvedValue(null)
    repo.findActiveWave.mockResolvedValue({
      id: 'w2',
      code: 'G2',
      registrationFee: 100000,
    })
    repo.ensureApplication.mockResolvedValue({
      id: 'app2',
      waveId: 'w2',
      payment: { status: 'UNPAID', amount: 100000 },
    })

    const result = await ensure.execute({ userId: 'u2' })

    expect(result.waveIsFull).toBe(false)
    expect(repo.isWaveFull).not.toHaveBeenCalled()
  })
})
