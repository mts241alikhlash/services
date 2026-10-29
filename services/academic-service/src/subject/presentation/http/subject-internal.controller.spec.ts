import { ISubjectRepository } from '../../domain/repositories/subject.repository.js'
import { SubjectInternalController } from './subject-internal.controller.js'

describe('SubjectInternalController', () => {
  const findManyByIds = jest.fn()
  const controller = new SubjectInternalController({
    findManyByIds,
  } as unknown as ISubjectRepository)

  beforeEach(() => jest.clearAllMocks())

  it('answers with id, name and code only', async () => {
    findManyByIds.mockResolvedValue([
      {
        id: 's-1',
        name: 'Ilmu Pengetahuan Alam',
        code: 'IPA',
        description: 'not exposed',
        isActive: true,
        deletedAt: null,
      },
    ])

    const result = await controller.byIds({ ids: ['s-1'] })

    expect(findManyByIds).toHaveBeenCalledWith(['s-1'])
    expect(result).toEqual({
      data: [{ id: 's-1', name: 'Ilmu Pengetahuan Alam', code: 'IPA' }],
    })
  })

  it('leaves unknown ids out and returns an empty list for none', async () => {
    findManyByIds.mockResolvedValue([])

    expect(await controller.byIds({ ids: ['missing'] })).toEqual({ data: [] })
  })

  it('reports a missing code as null', async () => {
    findManyByIds.mockResolvedValue([{ id: 's-2', name: 'PAI', code: null }])

    expect(await controller.byIds({ ids: ['s-2'] })).toEqual({
      data: [{ id: 's-2', name: 'PAI', code: null }],
    })
  })
})
