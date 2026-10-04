import { GetMetadataUseCase } from './get-metadata.use-case.js'

describe('GetMetadataUseCase condition consumer', () => {
  it('returns conditions from the condition repository', async () => {
    const conditions = [
      {
        id: 'condition-1',
        code: 'COND-GOOD',
        name: 'Baik',
        isUsable: true,
        createdAt: new Date('2026-09-13T00:00:00.000Z'),
      },
    ]
    const conditionRepository = {
      findMany: jest.fn().mockResolvedValue(conditions),
    }
    const useCase = new GetMetadataUseCase(
      { findMany: jest.fn().mockResolvedValue([]) } as never,
      { findMany: jest.fn().mockResolvedValue([]) } as never,
      conditionRepository as never,
      { findMany: jest.fn().mockResolvedValue([]) } as never,
      { findMany: jest.fn().mockResolvedValue([]) } as never,
    )

    const result = await useCase.execute()

    expect(result.conditions).toEqual(conditions)
    expect(conditionRepository.findMany).toHaveBeenCalledWith()
  })
})
