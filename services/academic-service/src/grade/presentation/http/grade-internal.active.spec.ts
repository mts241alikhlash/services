import { GradeInternalController } from './grade-internal.controller.js'

describe('GradeInternalController.active', () => {
  it('lists the active grades with their ids, lowest level first', async () => {
    const findAll = jest.fn().mockResolvedValue({
      data: [
        { id: 'g9', level: 9, name: 'Kelas 9' },
        { id: 'g7', level: 7, name: 'Kelas 7' },
        { id: 'g8', level: 8, name: null },
      ],
    })
    const controller = new GradeInternalController({ findAll } as never)

    await expect(controller.active()).resolves.toEqual({
      data: [
        { id: 'g7', level: 7, name: 'Kelas 7' },
        { id: 'g8', level: 8, name: null },
        { id: 'g9', level: 9, name: 'Kelas 9' },
      ],
    })
    expect(findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 200,
      isActive: true,
    })
  })
})
