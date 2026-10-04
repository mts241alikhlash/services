import { settleGuardian } from './settle-guardian.policy.js'

interface Row {
  relation: 'FATHER' | 'MOTHER' | 'GUARDIAN'
  isPrimary?: boolean
  sameAddressAsStudent?: boolean
}

const row = (relation: Row['relation'], extra: Partial<Row> = {}): Row => ({
  relation,
  isPrimary: false,
  sameAddressAsStudent: false,
  ...extra,
})

describe('settleGuardian', () => {
  it('makes the father the guardian when nobody is marked', () => {
    const settled = settleGuardian([row('FATHER'), row('MOTHER')])

    expect(settled.map((p) => [p.relation, p.isPrimary])).toEqual([
      ['FATHER', true],
      ['MOTHER', false],
    ])
  })

  it('leaves where each parent lives as the form sent it', () => {
    const settled = settleGuardian([
      row('FATHER', { sameAddressAsStudent: true }),
      row('MOTHER', { isPrimary: true, sameAddressAsStudent: false }),
    ])

    expect(settled.map((p) => p.sameAddressAsStudent)).toEqual([true, false])
  })

  it('drops a separate guardian once the mother is the guardian', () => {
    const settled = settleGuardian([
      row('FATHER'),
      row('MOTHER', { isPrimary: true }),
      row('GUARDIAN'),
    ])

    expect(settled.map((p) => p.relation)).toEqual(['FATHER', 'MOTHER'])
    expect(settled[1].isPrimary).toBe(true)
  })

  it('keeps a separate guardian chosen as the guardian', () => {
    const settled = settleGuardian([
      row('FATHER'),
      row('MOTHER'),
      row('GUARDIAN', { isPrimary: true }),
    ])

    expect(settled.map((p) => [p.relation, p.isPrimary])).toEqual([
      ['FATHER', false],
      ['MOTHER', false],
      ['GUARDIAN', true],
    ])
  })

  it('keeps an older draft guardian rather than dropping its data', () => {
    const settled = settleGuardian([row('FATHER'), row('GUARDIAN')])

    expect(settled.map((p) => [p.relation, p.isPrimary])).toEqual([
      ['FATHER', false],
      ['GUARDIAN', true],
    ])
  })

  it('leaves exactly one guardian when several are marked', () => {
    const settled = settleGuardian([
      row('FATHER', { isPrimary: true }),
      row('MOTHER', { isPrimary: true }),
    ])

    expect(settled.filter((p) => p.isPrimary)).toHaveLength(1)
    expect(settled[0].isPrimary).toBe(true)
  })
})
