import { toDetail } from './prisma-question.mapper.js'

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
  currentVersion: 2,
  revision: 3,
  createdById: 'user-1',
  createdAt: at,
  updatedAt: at,
  deletedAt: null,
  versions: [version(2, '<p>Baru</p>', 3), version(1, '<p>Lama</p>', 1)],
}

describe('toDetail', () => {
  it('picks the current version by number and leaves the version list out', () => {
    const detail = toDetail(row)

    expect(detail.current).toMatchObject({ number: 2, bodyHtml: '<p>Baru</p>' })
    expect('versions' in detail).toBe(false)
  })

  it('carries the package and the lineage', () => {
    expect(
      toDetail({ ...row, copiedFromQuestionId: 'q0', copiedFromVersion: 4 }),
    ).toMatchObject({
      packageId: 'package-1',
      copiedFromQuestionId: 'q0',
      copiedFromVersion: 4,
    })
  })

  it('fails loudly when the current version row is missing', () => {
    expect(() => toDetail({ ...row, currentVersion: 9 })).toThrow(
      'Question q1 has no version 9',
    )
  })
})
