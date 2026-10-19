import {
  compareByUrgency,
  deriveLateDocument,
  limitDateOf,
  overdueAfterOf,
  type LateDocumentUrgency,
} from './late-document.policy.js'

const limitDate = limitDateOf(new Date('2026-07-13'), 2) as Date
const overdueAfter = overdueAfterOf(new Date('2026-12-19')) as Date

function derive(
  documentStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null,
  now: Date,
  dates: { limit?: Date | null; overdue?: Date | null } = {},
) {
  return deriveLateDocument({
    documentStatus,
    now,
    limitDate: dates.limit === undefined ? limitDate : dates.limit,
    overdueAfter: dates.overdue === undefined ? overdueAfter : dates.overdue,
  })
}

describe('limitDateOf', () => {
  it('adds calendar months and ends the day in Jakarta', () => {
    expect(limitDate.toISOString()).toBe('2026-09-13T16:59:59.999Z')
  })

  it('clamps to the last day of a shorter month', () => {
    expect(limitDateOf(new Date('2026-12-31'), 2)?.toISOString()).toBe(
      '2027-02-28T16:59:59.999Z',
    )
  })

  it('is null without a start date or months', () => {
    expect(limitDateOf(null, 2)).toBeNull()
    expect(limitDateOf(new Date('2026-07-13'), null)).toBeNull()
  })
})

describe('overdueAfterOf', () => {
  it('ends the first semester at the end of its last day in Jakarta', () => {
    expect(overdueAfter.toISOString()).toBe('2026-12-19T16:59:59.999Z')
    expect(overdueAfterOf(null)).toBeNull()
  })
})

describe('deriveLateDocument', () => {
  it('a missing file is MISSING and ON_TIME before the limit date', () => {
    expect(derive(null, new Date('2026-08-01T00:00:00Z'))).toEqual({
      state: 'MISSING',
      urgency: 'ON_TIME',
    })
  })

  it('maps the document status to the state', () => {
    const now = new Date('2026-08-01T00:00:00Z')
    expect(derive('PENDING', now).state).toBe('PENDING')
    expect(derive('REJECTED', now).state).toBe('REJECTED')
    expect(derive('APPROVED', now).state).toBe('APPROVED')
  })

  it('is still ON_TIME exactly at the end of the limit day and LATE a millisecond later', () => {
    expect(derive(null, limitDate).urgency).toBe('ON_TIME')
    expect(derive(null, new Date(limitDate.getTime() + 1)).urgency).toBe('LATE')
  })

  it('is OVERDUE after the end of the first semester', () => {
    expect(derive(null, overdueAfter).urgency).toBe('LATE')
    expect(derive(null, new Date(overdueAfter.getTime() + 1)).urgency).toBe(
      'OVERDUE',
    )
  })

  it('never says LATE without a limit date and never OVERDUE without an end date', () => {
    const late = new Date('2027-03-01T00:00:00Z')
    expect(derive(null, late, { limit: null, overdue: null }).urgency).toBe(
      'ON_TIME',
    )
    expect(derive(null, late, { overdue: null }).urgency).toBe('LATE')
    expect(derive(null, late, { limit: null }).urgency).toBe('OVERDUE')
  })

  it('treats an approved file as ON_TIME even past every date', () => {
    expect(derive('APPROVED', new Date('2027-03-01T00:00:00Z'))).toEqual({
      state: 'APPROVED',
      urgency: 'ON_TIME',
    })
  })
})

describe('compareByUrgency', () => {
  const row = (urgency: LateDocumentUrgency, registrationNumber: string) => ({
    urgency,
    registrationNumber,
  })

  it('orders OVERDUE before LATE before ON_TIME, then by registration number', () => {
    const rows = [
      row('ON_TIME', 'PSB-001'),
      row('LATE', 'PSB-009'),
      row('OVERDUE', 'PSB-050'),
      row('LATE', 'PSB-002'),
    ]

    expect([...rows].sort(compareByUrgency)).toEqual([
      row('OVERDUE', 'PSB-050'),
      row('LATE', 'PSB-002'),
      row('LATE', 'PSB-009'),
      row('ON_TIME', 'PSB-001'),
    ])
  })
})
