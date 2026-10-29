import { BadRequestException } from '@nestjs/common'
import type { ApprovedQuestionRef } from '../../../question/domain/entities/question.entity.js'
import { assertPackageItems } from './assert-package-items.policy.js'

const SUBJECT = '11111111-1111-4111-8111-111111111111'
const GRADE = '22222222-2222-4222-8222-222222222222'

function ref(
  id: string,
  overrides: Partial<ApprovedQuestionRef> = {},
): ApprovedQuestionRef {
  return {
    id,
    subjectId: SUBJECT,
    gradeId: GRADE,
    status: 'APPROVED',
    approvedVersion: 1,
    deletedAt: null,
    ...overrides,
  }
}

const target = { subjectId: SUBJECT, gradeId: GRADE }

describe('assertPackageItems', () => {
  it('accepts approved questions of the same subject and grade', () => {
    expect(() =>
      assertPackageItems({ ...target, questions: [ref('a'), ref('b')] }, [
        'a',
        'b',
      ]),
    ).not.toThrow()
  })

  it('rejects an empty package', () => {
    expect(() => assertPackageItems({ ...target, questions: [] }, [])).toThrow(
      BadRequestException,
    )
  })

  it('rejects an id that does not exist', () => {
    expect(() =>
      assertPackageItems({ ...target, questions: [ref('a')] }, ['a', 'zzz']),
    ).toThrow('Soal tidak ditemukan')
  })

  it('rejects the same question twice', () => {
    expect(() =>
      assertPackageItems({ ...target, questions: [ref('a')] }, ['a', 'a']),
    ).toThrow('Soal yang sama tidak boleh dimasukkan dua kali')
  })

  it('rejects a question that is not approved', () => {
    expect(() =>
      assertPackageItems(
        { ...target, questions: [ref('a', { status: 'SUBMITTED' })] },
        ['a'],
      ),
    ).toThrow('Hanya soal yang sudah disetujui')
  })

  it('rejects an approved question that has no approved version yet', () => {
    expect(() =>
      assertPackageItems(
        { ...target, questions: [ref('a', { approvedVersion: null })] },
        ['a'],
      ),
    ).toThrow('Hanya soal yang sudah disetujui')
  })

  it('rejects a deleted question', () => {
    expect(() =>
      assertPackageItems(
        { ...target, questions: [ref('a', { deletedAt: new Date() })] },
        ['a'],
      ),
    ).toThrow('Soal tidak ditemukan')
  })

  it('rejects a question of another subject', () => {
    expect(() =>
      assertPackageItems(
        {
          ...target,
          questions: [
            ref('a', { subjectId: '33333333-3333-4333-8333-333333333333' }),
          ],
        },
        ['a'],
      ),
    ).toThrow('mapel dan tingkat yang sama')
  })

  it('rejects a question of another grade', () => {
    expect(() =>
      assertPackageItems(
        {
          ...target,
          questions: [
            ref('a', { gradeId: '44444444-4444-4444-8444-444444444444' }),
          ],
        },
        ['a'],
      ),
    ).toThrow('mapel dan tingkat yang sama')
  })

  it('skips the per-question checks for ids that are already pinned', () => {
    expect(() =>
      assertPackageItems(
        { ...target, questions: [ref('b')] },
        ['a', 'b'],
        new Set(['a']),
      ),
    ).not.toThrow()
  })

  it('still rejects an unapproved question that is not pinned', () => {
    expect(() =>
      assertPackageItems(
        { ...target, questions: [ref('b', { status: 'DRAFT' })] },
        ['a', 'b'],
        new Set(['a']),
      ),
    ).toThrow('Hanya soal yang sudah disetujui')
  })

  it('still rejects an empty package and duplicates when ids are pinned', () => {
    expect(() =>
      assertPackageItems({ ...target, questions: [] }, [], new Set()),
    ).toThrow('minimal satu soal')
    expect(() =>
      assertPackageItems(
        { ...target, questions: [] },
        ['a', 'a'],
        new Set(['a']),
      ),
    ).toThrow('tidak boleh dimasukkan dua kali')
  })
})
