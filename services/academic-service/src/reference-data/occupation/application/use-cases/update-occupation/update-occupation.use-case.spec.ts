import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IOccupationRepository } from '../../../domain/repositories/occupation.repository.js'
import { UpdateOccupationUseCase } from './update-occupation.use-case.js'
import type { UpdateOccupationInput } from './update-occupation.input.js'

describe('UpdateOccupationUseCase', () => {
  let useCase: UpdateOccupationUseCase

  const mockRepo = {
    findById: jest.fn(),
    findByName: jest.fn(),
    update: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateOccupationUseCase,
        { provide: IOccupationRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<UpdateOccupationUseCase>(UpdateOccupationUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    const id = 'occ-1'
    const currentOccupation = {
      id: 'occ-1',
      name: 'Wiraswasta',
      isActive: true,
    }

    it('should update an occupation successfully (no name change)', async () => {
      const input: UpdateOccupationInput = { isActive: false }
      const updated = { ...currentOccupation, isActive: false }

      mockRepo.findById.mockResolvedValue(currentOccupation)
      mockRepo.update.mockResolvedValue(updated)

      const result = await useCase.execute(id, input)

      expect(mockRepo.findById).toHaveBeenCalledWith(id)
      expect(mockRepo.findByName).not.toHaveBeenCalled()
      expect(mockRepo.update).toHaveBeenCalledWith(id, {
        name: input.name,
        isActive: input.isActive,
      })
      expect(result).toEqual(updated)
    })

    it('should check uniqueness when name changes', async () => {
      const input: UpdateOccupationInput = { name: 'PNS' }

      mockRepo.findById.mockResolvedValue(currentOccupation)
      mockRepo.findByName.mockResolvedValue(null)
      mockRepo.update.mockResolvedValue({ ...currentOccupation, name: 'PNS' })

      await useCase.execute(id, input)

      expect(mockRepo.findByName).toHaveBeenCalledWith('PNS', id)
    })

    it('should throw NotFoundException when occupation is not found', async () => {
      const input: UpdateOccupationInput = { name: 'PNS' }
      mockRepo.findById.mockResolvedValue(null)

      await expect(useCase.execute(id, input)).rejects.toThrow(
        NotFoundException,
      )
      expect(mockRepo.update).not.toHaveBeenCalled()
    })

    it('should throw ConflictException when new name is already taken', async () => {
      const input: UpdateOccupationInput = { name: 'PNS' }

      mockRepo.findById.mockResolvedValue(currentOccupation)
      mockRepo.findByName.mockResolvedValue({ id: 'occ-other' })

      await expect(useCase.execute(id, input)).rejects.toThrow(
        ConflictException,
      )
      expect(mockRepo.update).not.toHaveBeenCalled()
    })

    it('should NOT call findByName when name is not in dto', async () => {
      const input: UpdateOccupationInput = { isActive: true }

      mockRepo.findById.mockResolvedValue(currentOccupation)
      mockRepo.update.mockResolvedValue(currentOccupation)

      await useCase.execute(id, input)

      expect(mockRepo.findByName).not.toHaveBeenCalled()
    })
  })
})
