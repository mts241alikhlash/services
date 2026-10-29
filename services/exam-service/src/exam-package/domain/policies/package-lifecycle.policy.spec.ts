import { ConflictException, ForbiddenException } from '@nestjs/common'
import {
  assertCanChange,
  assertCanReview,
  assertCanSchedule,
  assertCanSubmit,
  assertCanTakeFrom,
  assertEditable,
  assertNotOwnReview,
} from './package-lifecycle.policy.js'

describe('package lifecycle policy', () => {
  it('editing a draft or returned package keeps its status', () => {
    expect(assertEditable('DRAFT')).toBe('DRAFT')
    expect(assertEditable('RETURNED')).toBe('RETURNED')
  })

  it('editing an approved package returns it to draft', () => {
    expect(assertEditable('APPROVED')).toBe('DRAFT')
  })

  it('a submitted or locked package refuses edits', () => {
    expect(() => assertEditable('SUBMITTED')).toThrow(ConflictException)
    expect(() => assertEditable('LOCKED')).toThrow(ConflictException)
    expect(() => assertEditable('SUBMITTED')).toThrow(/SUBMITTED/u)
  })

  it('submit refuses an empty package with "Paket belum berisi soal"', () => {
    expect(() => assertCanSubmit('DRAFT', 0)).toThrow('Paket belum berisi soal')
  })

  it('submit only from draft or returned', () => {
    expect(() => assertCanSubmit('DRAFT', 1)).not.toThrow()
    expect(() => assertCanSubmit('RETURNED', 1)).not.toThrow()
    for (const status of ['SUBMITTED', 'APPROVED', 'LOCKED'] as const) {
      expect(() => assertCanSubmit(status, 1)).toThrow(ConflictException)
    }
  })

  it('review only a submitted package', () => {
    expect(() => assertCanReview('SUBMITTED')).not.toThrow()
    for (const status of ['DRAFT', 'RETURNED', 'APPROVED', 'LOCKED'] as const) {
      expect(() => assertCanReview(status)).toThrow(ConflictException)
    }
  })

  it('only an approved or already scheduled package can be scheduled', () => {
    expect(() => assertCanSchedule('APPROVED')).not.toThrow()
    expect(() => assertCanSchedule('LOCKED')).not.toThrow()
    for (const status of ['DRAFT', 'SUBMITTED', 'RETURNED'] as const) {
      expect(() => assertCanSchedule(status)).toThrow(ConflictException)
    }
  })

  it('questions are taken only from approved or locked packages', () => {
    expect(() => assertCanTakeFrom('APPROVED')).not.toThrow()
    expect(() => assertCanTakeFrom('LOCKED')).not.toThrow()
    for (const status of ['DRAFT', 'SUBMITTED', 'RETURNED'] as const) {
      expect(() => assertCanTakeFrom(status)).toThrow(ConflictException)
    }
  })

  it('only the author or a manager changes a package', () => {
    expect(() => assertCanChange('user-1', 'user-1', false)).not.toThrow()
    expect(() => assertCanChange('user-1', 'user-2', true)).not.toThrow()
    expect(() => assertCanChange('user-1', 'user-2', false)).toThrow(
      ForbiddenException,
    )
  })

  it('nobody approves their own package, not even someone who manages all', () => {
    expect(() => assertNotOwnReview('user-1', 'user-1')).toThrow(
      ForbiddenException,
    )
    expect(() => assertNotOwnReview('user-1', 'user-2')).not.toThrow()
  })
})
