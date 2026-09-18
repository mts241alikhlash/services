import { GetMyReportCardsUseCase } from './get-my-report-cards.use-case.js'
import type { GetReportCardsUseCase } from '../get-report-cards/get-report-cards.use-case.js'
import type { IStudentIdentityReadPort } from '../../../../platform/student-identity/student-identity.port.js'

describe('GetMyReportCardsUseCase', () => {
  function build(studentId: string | null) {
    const execute = jest.fn().mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
    })
    const getReportCards = { execute } as unknown as GetReportCardsUseCase
    const studentIdentity = {
      findStudentIdByUserId: jest.fn().mockResolvedValue(studentId),
    } as unknown as IStudentIdentityReadPort

    return {
      useCase: new GetMyReportCardsUseCase(getReportCards, studentIdentity),
      execute,
    }
  }

  it('scopes the read to the caller and forces published', async () => {
    const { useCase, execute } = build('stu-1')

    await useCase.execute({ page: 1, limit: 10 }, 'user-1')

    expect(execute).toHaveBeenCalledWith(
      { page: 1, limit: 10 },
      { studentId: 'stu-1' },
    )
  })

  it('ignores a studentId the caller supplies', async () => {
    const { useCase, execute } = build('stu-1')

    await useCase.execute({ page: 1, limit: 10, studentId: 'stu-2' }, 'user-1')

    expect(execute.mock.calls[0][1]).toEqual({ studentId: 'stu-1' })
  })

  it('returns an empty page when the account has no student record', async () => {
    const { useCase, execute } = build(null)

    const result = await useCase.execute({ page: 2, limit: 25 }, 'user-1')

    expect(execute).not.toHaveBeenCalled()
    expect(result).toEqual({
      data: [],
      total: 0,
      page: 2,
      limit: 25,
      summary: { published: 0, draft: 0, averageScore: null },
    })
  })
})
