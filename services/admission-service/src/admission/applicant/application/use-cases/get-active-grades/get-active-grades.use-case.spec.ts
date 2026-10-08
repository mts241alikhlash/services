import { GetActiveGradesUseCase } from './get-active-grades.use-case.js'

describe('GetActiveGradesUseCase', () => {
  it('lists the active grades from academic-service', async () => {
    const lookup = {
      activeGrades: jest
        .fn()
        .mockResolvedValue([{ id: 'g7', level: 7, name: 'Kelas 7' }]),
    }

    await expect(
      new GetActiveGradesUseCase(lookup as never).execute(),
    ).resolves.toEqual([{ id: 'g7', level: 7, name: 'Kelas 7' }])
  })

  it('lets a lookup failure surface instead of answering an empty list', async () => {
    const lookup = {
      activeGrades: jest.fn().mockRejectedValue(new Error('down')),
    }

    await expect(
      new GetActiveGradesUseCase(lookup as never).execute(),
    ).rejects.toThrow('down')
  })
})
