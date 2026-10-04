import { ConflictException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IAdmissionApplicantRepository } from '../../../domain/repositories/admission-applicant-repository.js'
import { EnsureMyApplicationUseCase } from './ensure-my-application.use-case.js'

describe('EnsureMyApplicationUseCase', () => {
  const repo = {
    findMyDetail: jest.fn(),
    findActiveWave: jest.fn(),
    ensureApplication: jest.fn(),
    findActiveDocumentTypes: jest.fn(),
  }

  let ensure: EnsureMyApplicationUseCase

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnsureMyApplicationUseCase,
        { provide: IAdmissionApplicantRepository, useValue: repo },
      ],
    }).compile()

    ensure = module.get(EnsureMyApplicationUseCase)
    jest.clearAllMocks()
    repo.findActiveDocumentTypes.mockResolvedValue([])
  })

  it('returns the existing application without creating one', async () => {
    const existing = { id: 'app1', userId: 'u1' }
    repo.findMyDetail.mockResolvedValue(existing)

    const result = await ensure.execute({ userId: 'u1' })

    expect(result).toMatchObject({ id: 'app1', userId: 'u1' })
    expect(result.documentTypes).toEqual([])
    expect(repo.ensureApplication).not.toHaveBeenCalled()
    expect(repo.findActiveWave).not.toHaveBeenCalled()
  })

  it('creates an application on the active wave when none exists', async () => {
    const wave = { id: 'w1', code: 'W1', registrationFee: 100000 }
    repo.findMyDetail.mockResolvedValue(null)
    repo.findActiveWave.mockResolvedValue(wave)
    repo.ensureApplication.mockResolvedValue({ id: 'app1', userId: 'u1' })

    const result = await ensure.execute({ userId: 'u1' })

    expect(repo.ensureApplication).toHaveBeenCalledWith({
      userId: 'u1',
      waveId: 'w1',
      waveCode: 'W1',
      registrationFee: 100000,
    })
    expect(result).toMatchObject({ id: 'app1', userId: 'u1' })
    expect(result.documentTypes).toEqual([])
  })

  it('conflicts when no active wave exists and creates nothing', async () => {
    repo.findMyDetail.mockResolvedValue(null)
    repo.findActiveWave.mockResolvedValue(null)

    await expect(ensure.execute({ userId: 'u1' })).rejects.toThrow(
      ConflictException,
    )
    expect(repo.ensureApplication).not.toHaveBeenCalled()
  })

  it('reads the existing application before creating', async () => {
    const order: string[] = []
    repo.findMyDetail.mockImplementation(() => {
      order.push('findMyDetail')
      return Promise.resolve(null)
    })
    repo.findActiveWave.mockResolvedValue({
      id: 'w1',
      code: 'W1',
      registrationFee: 100000,
    })
    repo.ensureApplication.mockImplementation(() => {
      order.push('ensureApplication')
      return Promise.resolve({ id: 'app1', userId: 'u1' })
    })

    await ensure.execute({ userId: 'u1' })

    expect(order).toEqual(['findMyDetail', 'ensureApplication'])
  })
})
