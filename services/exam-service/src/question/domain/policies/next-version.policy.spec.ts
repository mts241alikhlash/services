import { nextVersionAction } from './next-version.policy.js'

describe('nextVersionAction', () => {
  it('writes a new version only when the question is approved', () => {
    expect(nextVersionAction('APPROVED')).toBe('new-version')
  })

  it.each(['DRAFT', 'SUBMITTED', 'RETURNED'] as const)(
    'edits %s in place',
    (status) => {
      expect(nextVersionAction(status)).toBe('edit-in-place')
    },
  )
})
