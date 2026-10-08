import { assertTransition } from './admission-status.transitions.js'

describe('admission status transitions', () => {
  it.each([
    ['ACCEPTED', 'VERIFIED'],
    ['REJECTED', 'SUBMITTED'],
    ['VERIFIED', 'ACCEPTED'],
    ['VERIFIED', 'REJECTED'],
    ['SUBMITTED', 'REJECTED'],
    ['ACCEPTED', 'ENROLLING'],
  ] as const)('allows %s to %s', (from, to) => {
    expect(() => assertTransition(from, to)).not.toThrow()
  })

  it.each([
    ['ENROLLING', 'VERIFIED'],
    ['ENROLLED', 'VERIFIED'],
    ['REJECTED', 'VERIFIED'],
    ['REJECTED', 'ACCEPTED'],
    ['DRAFT', 'ACCEPTED'],
  ] as const)('refuses %s to %s', (from, to) => {
    expect(() => assertTransition(from, to)).toThrow()
  })
})
