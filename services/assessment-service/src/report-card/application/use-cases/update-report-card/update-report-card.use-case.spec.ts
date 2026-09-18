import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { IReportCardRepository } from '../../../domain/repositories/report-card.repository.js'
import { UpdateReportCardUseCase } from './update-report-card.use-case.js'
import type { UpdateReportCardInput } from './update-report-card.input.js'

describe('UpdateReportCardUseCase', () => {
  let useCase: UpdateReportCardUseCase

  const mockRepo = { findById: jest.fn(), update: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateReportCardUseCase,
        { provide: IReportCardRepository, useValue: mockRepo },
      ],
    }).compile()

    useCase = module.get<UpdateReportCardUseCase>(UpdateReportCardUseCase)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(useCase).toBeDefined()
  })

  describe('execute', () => {
    it('should update reportCard successfully', async () => {
      const input: UpdateReportCardInput = {
        employeeNote: 'Baik sekali',
        rank: 1,
      }
      mockRepo.findById.mockResolvedValue({ id: 'rap-1' })
      const updated = { id: 'rap-1', employeeNote: 'Baik sekali', rank: 1 }
      mockRepo.update.mockResolvedValue(updated)

      const result = await useCase.execute('rap-1', input)

      expect(mockRepo.findById).toHaveBeenCalledWith('rap-1')
      expect(mockRepo.update).toHaveBeenCalledWith('rap-1', {
        employeeNote: input.employeeNote,
        rank: input.rank,
      })
      expect(result).toEqual(updated)
    })

    it('never writes isPublished, whatever it is handed', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'rap-1', isPublished: false })
      mockRepo.update.mockResolvedValue({ id: 'rap-1' })

      await useCase.execute('rap-1', {
        employeeNote: 'Baik',
        isPublished: true,
      } as unknown as UpdateReportCardInput)

      expect(mockRepo.update).toHaveBeenCalledWith('rap-1', {
        employeeNote: 'Baik',
        rank: undefined,
      })
      expect(mockRepo.update).not.toHaveBeenCalledWith(
        'rap-1',
        expect.objectContaining({ isPublished: expect.anything() }),
      )
    })

    it('should throw NotFoundException when not found', async () => {
      mockRepo.findById.mockResolvedValue(null)

      await expect(useCase.execute('rap-missing', {})).rejects.toThrow(
        NotFoundException,
      )
      expect(mockRepo.update).not.toHaveBeenCalled()
    })
  })
})
