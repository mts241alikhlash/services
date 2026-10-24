import { ConflictException } from '@nestjs/common'
import {
  assertCanApprove,
  assertCanReturn,
  assertCanSubmit,
} from './review-transitions.policy.js'
import type { QuestionStatus } from '../value-objects/question-content.js'

const ALL: QuestionStatus[] = ['DRAFT', 'SUBMITTED', 'APPROVED', 'RETURNED']

function allowed(check: (status: QuestionStatus) => void): QuestionStatus[] {
  return ALL.filter((status) => {
    try {
      check(status)
      return true
    } catch {
      return false
    }
  })
}

describe('review transitions', () => {
  it('submits only a draft or a returned question', () => {
    expect(allowed(assertCanSubmit)).toEqual(['DRAFT', 'RETURNED'])
  })

  it('approves only a submitted question', () => {
    expect(allowed(assertCanApprove)).toEqual(['SUBMITTED'])
  })

  it('returns only a submitted question', () => {
    expect(allowed(assertCanReturn)).toEqual(['SUBMITTED'])
  })

  it('says why in Indonesian with a 409', () => {
    expect(() => assertCanSubmit('SUBMITTED')).toThrow(
      new ConflictException('Soal sudah diajukan'),
    )
    expect(() => assertCanSubmit('APPROVED')).toThrow(
      new ConflictException(
        'Soal sudah disetujui, ubah soal untuk membuat versi baru',
      ),
    )
    expect(() => assertCanApprove('DRAFT')).toThrow(
      new ConflictException('Hanya soal yang diajukan yang bisa disetujui'),
    )
    expect(() => assertCanReturn('APPROVED')).toThrow(
      new ConflictException('Hanya soal yang diajukan yang bisa dikembalikan'),
    )
  })
})
