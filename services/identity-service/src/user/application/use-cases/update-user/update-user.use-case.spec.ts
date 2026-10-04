import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { UpdateUserInput } from './update-user.input.js'
import { IUserRepository } from '../../../domain/repositories/user.repository.js'
import { UpdateUserUseCase } from './update-user.use-case.js'
import { hashPassword } from '../../../../shared/utils/hash.helper.js'

jest.mock('../../../../shared/utils/hash.helper.js', () => ({
  hashPassword: jest.fn(),
}))

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase

  const mockRepo = {
    findById: jest.fn(),
    findByIdentifier: jest.fn(),
    update: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserUseCase,
        { provide: IUserRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<UpdateUserUseCase>(UpdateUserUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const id = 'user-1'
    const mockUser = { id, identifier: 'same-user' }

    it('should update a user successfully', async () => {
      const input: UpdateUserInput = { identifier: 'updated-user' }
      const updated = { id, identifier: 'updated-user' }
      mockRepo.findById.mockResolvedValue(mockUser)
      mockRepo.findByIdentifier.mockResolvedValue(null)
      mockRepo.update.mockResolvedValue(updated)

      const result = await useCase.execute(id, input)

      expect(mockRepo.findById).toHaveBeenCalledWith(id)
      expect(mockRepo.update).toHaveBeenCalledWith(
        id,
        expect.objectContaining({ identifier: 'updated-user' }),
      )
      expect(result).toEqual(updated)
    })

    it('should allow same username for the same user (self-update)', async () => {
      const input: UpdateUserInput = { identifier: 'same-user' }
      mockRepo.findById.mockResolvedValue(mockUser)
      mockRepo.findByIdentifier.mockResolvedValue(mockUser)
      mockRepo.update.mockResolvedValue(mockUser)

      const result = await useCase.execute(id, input)

      expect(result).toBeDefined()
      expect(mockRepo.update).toHaveBeenCalled()
    })

    it('should hash password when provided', async () => {
      const input: UpdateUserInput = { password: 'newpass' }
      mockRepo.findById.mockResolvedValue(mockUser)
      ;(hashPassword as jest.Mock).mockResolvedValue('hashed')
      mockRepo.update.mockResolvedValue({ id })

      await useCase.execute(id, input)

      expect(hashPassword).toHaveBeenCalledWith('newpass')
    })

    it('should NOT hash password when not provided', async () => {
      const input: UpdateUserInput = {}
      mockRepo.findById.mockResolvedValue(mockUser)
      mockRepo.update.mockResolvedValue({ id })

      await useCase.execute(id, input)

      expect(hashPassword).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException when user does not exist', async () => {
      const input: UpdateUserInput = { identifier: 'x' }
      mockRepo.findById.mockResolvedValue(null)

      await expect(useCase.execute(id, input)).rejects.toThrow(
        NotFoundException,
      )
      expect(mockRepo.update).not.toHaveBeenCalled()
    })

    it('should throw ConflictException when username is taken by another user', async () => {
      const input: UpdateUserInput = { identifier: 'taken' }
      mockRepo.findById.mockResolvedValue(mockUser)
      mockRepo.findByIdentifier.mockResolvedValue({
        id: 'user-other',
        identifier: 'taken',
      })

      await expect(useCase.execute(id, input)).rejects.toThrow(
        ConflictException,
      )
      expect(mockRepo.update).not.toHaveBeenCalled()
    })
  })
})
