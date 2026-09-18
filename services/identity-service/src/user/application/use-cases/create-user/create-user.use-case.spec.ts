import { ConflictException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { CreateUserInput } from './create-user.input.js'
import { IUserRepository } from '../../../domain/repositories/user.repository.js'
import { CreateUserUseCase } from './create-user.use-case.js'
import { hashPassword } from '../../../../shared/utils/hash.helper.js'

jest.mock('../../../../shared/utils/hash.helper.js', () => ({
  hashPassword: jest.fn(),
}))

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase

  const mockRepo = {
    existsByIdentifier: jest.fn(),
    create: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        { provide: IUserRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<CreateUserUseCase>(CreateUserUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const input: CreateUserInput = {
      identifier: 'newuser',
      password: 'pass123',
    }

    it('should create a user successfully', async () => {
      const created = {
        id: 'user-1',
        identifier: 'newuser',
      }
      mockRepo.existsByIdentifier.mockResolvedValue(false)
      ;(hashPassword as jest.Mock).mockResolvedValue('hashed-pass')
      mockRepo.create.mockResolvedValue(created)

      const result = await useCase.execute(input)

      expect(mockRepo.existsByIdentifier).toHaveBeenCalledWith(input.identifier)
      expect(hashPassword).toHaveBeenCalledWith(input.password)
      expect(mockRepo.create).toHaveBeenCalledWith({
        identifier: input.identifier,
        passwordHash: 'hashed-pass',
      })
      expect(result).toEqual(created)
    })

    it('should throw ConflictException when username is already taken', async () => {
      mockRepo.existsByIdentifier.mockResolvedValue(true)

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException)
      expect(mockRepo.create).not.toHaveBeenCalled()
    })
  })
})
