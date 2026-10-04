import { Test, TestingModule } from '@nestjs/testing'
import { GetProfilesByIdsUseCase } from './get-profiles-by-ids.use-case.js'
import { IUserRepository } from '../../../domain/repositories/user.repository.js'
import { UserGender } from '../../../../shared/domain/enums/user-gender.enum.js'

describe('GetProfilesByIdsUseCase', () => {
  let useCase: GetProfilesByIdsUseCase
  const mockUserRepository = { findProfilesByUserIds: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProfilesByIdsUseCase,
        { provide: IUserRepository, useValue: mockUserRepository },
      ],
    }).compile()

    useCase = module.get<GetProfilesByIdsUseCase>(GetProfilesByIdsUseCase)
    jest.clearAllMocks()
  })

  it('delegates to the repository with the ids it was given', async () => {
    const profiles = [
      {
        userId: 'user-1',
        identifier: 'guru001',
        isActive: true,
        name: 'Ahmad Fauzi',
        gender: UserGender.MALE,
        nik: '3578012345678901',
        avatarStorageKey: null,
      },
    ]
    mockUserRepository.findProfilesByUserIds.mockResolvedValue(profiles)

    const result = await useCase.execute(['user-1', 'user-2'])

    expect(mockUserRepository.findProfilesByUserIds).toHaveBeenCalledWith([
      'user-1',
      'user-2',
    ])
    expect(result).toEqual(profiles)
  })

  it('passes an empty list straight through', async () => {
    mockUserRepository.findProfilesByUserIds.mockResolvedValue([])

    const result = await useCase.execute([])

    expect(mockUserRepository.findProfilesByUserIds).toHaveBeenCalledWith([])
    expect(result).toEqual([])
  })
})
