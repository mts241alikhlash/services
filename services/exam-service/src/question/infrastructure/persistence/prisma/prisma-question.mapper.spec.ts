import { toDetail, toSummary } from './prisma-question.mapper.js'

const at = new Date('2026-10-24T08:00:00.000Z')

const version = (number: number, bodyHtml: string, points: number) => ({
  id: `v${number}`,
  questionId: 'q1',
  number,
  bodyHtml,
  content: { answer: { value: true } },
  points,
  createdById: 'user-1',
  createdAt: at,
})

const row = {
  id: 'q1',
  packageId: 'package-1',
  copiedFromQuestionId: null,
  copiedFromVersion: null,
  subjectId: 'math',
  gradeId: 'grade-7',
  authorEmployeeId: 'emp-1',
  type: 'TRUE_FALSE' as const,
  status: 'DRAFT' as const,
  currentVersion: 2,
  approvedVersion: 1,
  revision: 3,
  createdById: 'user-1',
  createdAt: at,
  updatedAt: at,
  deletedAt: null,
  versions: [version(2, '<p>Baru</p>', 3), version(1, '<p>Lama</p>', 1)],
  reviews: [
    {
      id: 'r1',
      questionId: 'q1',
      versionNumber: 1,
      action: 'APPROVED' as const,
      note: null,
      byUserId: 'user-9',
      createdAt: at,
    },
  ],
}

describe('toDetail', () => {
  it('picks the current and approved versions by number', () => {
    const detail = toDetail(row)

    expect(detail.current).toMatchObject({ number: 2, bodyHtml: '<p>Baru</p>' })
    expect(detail.approved).toMatchObject({
      number: 1,
      bodyHtml: '<p>Lama</p>',
    })
    expect(detail.reviews).toHaveLength(1)
    expect('versions' in detail).toBe(false)
  })

  it('has no approved version for a question never approved', () => {
    expect(toDetail({ ...row, approvedVersion: null }).approved).toBeNull()
  })
})

describe('toSummary', () => {
  it('carries the current body and points', () => {
    expect(toSummary(row)).toMatchObject({
      id: 'q1',
      bodyHtml: '<p>Baru</p>',
      points: 3,
    })
  })
})
