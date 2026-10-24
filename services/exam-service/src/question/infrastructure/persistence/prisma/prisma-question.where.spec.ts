import { buildQuestionWhere } from './prisma-question.where.js'

const base = { page: 1, limit: 10, pairs: null }

describe('buildQuestionWhere', () => {
  it('always leaves out deleted questions', () => {
    expect(buildQuestionWhere(base)).toEqual({ AND: [{ deletedAt: null }] })
  })

  it('limits a teacher to their pairs on top of the filters they asked for', () => {
    const where = buildQuestionWhere({
      ...base,
      pairs: [
        { subjectId: 'math', gradeId: 'grade-7' },
        { subjectId: 'ipa', gradeId: 'grade-8' },
      ],
      subjectId: 'ipa',
      status: 'APPROVED',
    })

    expect(where).toEqual({
      AND: [
        { deletedAt: null },
        {
          OR: [
            { subjectId: 'math', gradeId: 'grade-7' },
            { subjectId: 'ipa', gradeId: 'grade-8' },
          ],
        },
        { subjectId: 'ipa' },
        { status: 'APPROVED' },
      ],
    })
  })

  it('searches the body of any version without caring about case', () => {
    expect(buildQuestionWhere({ ...base, search: 'Pecahan' })).toEqual({
      AND: [
        { deletedAt: null },
        {
          versions: {
            some: { bodyHtml: { contains: 'Pecahan', mode: 'insensitive' } },
          },
        },
      ],
    })
  })
})
