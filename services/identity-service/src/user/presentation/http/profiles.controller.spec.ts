import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { UserGender } from '../../../shared/domain/enums/user-gender.enum.js'
import { BatchProfileLookupDto } from './dto/request/batch-profile-lookup.dto.js'
import { GetProfilesByIdsUseCase } from '../../application/use-cases/get-profiles-by-ids/get-profiles-by-ids.use-case.js'
import { ProfilesController } from './profiles.controller.js'

describe('ProfilesController', () => {
  let controller: ProfilesController

  const mockGetProfilesByIdsUseCase = { execute: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        {
          provide: GetProfilesByIdsUseCase,
          useValue: mockGetProfilesByIdsUseCase,
        },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile()

    controller = module.get<ProfilesController>(ProfilesController)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('batch', () => {
    it('delegates to GetProfilesByIdsUseCase with the requested ids and wraps the result', async () => {
      const dto: BatchProfileLookupDto = { userIds: ['user-1', 'user-2'] }
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
      mockGetProfilesByIdsUseCase.execute.mockResolvedValue(profiles)

      const result = await controller.batch(dto)

      expect(mockGetProfilesByIdsUseCase.execute).toHaveBeenCalledWith([
        'user-1',
        'user-2',
      ])
      expect(result).toEqual({ data: profiles })
    })
  })
})
