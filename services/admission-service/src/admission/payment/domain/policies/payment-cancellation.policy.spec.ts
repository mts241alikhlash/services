import { canCancelVerification } from './payment-cancellation.policy.js'

describe('canCancelVerification', () => {
  it.each(['DRAFT', 'SUBMITTED', 'REVISION_NEEDED', 'VERIFIED'])(
    'allows %s',
    (status) => {
      expect(canCancelVerification(status)).toBe(true)
    },
  )

  it.each(['ACCEPTED', 'ENROLLING', 'REJECTED', 'ENROLLED'])(
    'refuses %s',
    (status) => {
      expect(canCancelVerification(status)).toBe(false)
    },
  )
})
