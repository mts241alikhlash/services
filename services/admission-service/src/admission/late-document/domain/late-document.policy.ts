export type LateDocumentState = 'MISSING' | 'PENDING' | 'REJECTED' | 'APPROVED'
export type LateDocumentUrgency = 'ON_TIME' | 'LATE' | 'OVERDUE'

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000
const URGENCY_ORDER: Record<LateDocumentUrgency, number> = {
  OVERDUE: 0,
  LATE: 1,
  ON_TIME: 2,
}

function endOfDayJakarta(year: number, month: number, day: number): Date {
  return new Date(
    Date.UTC(year, month, day, 23, 59, 59, 999) - JAKARTA_OFFSET_MS,
  )
}

export function limitDateOf(
  startDate: Date | null,
  months: number | null,
): Date | null {
  if (!startDate || months === null) return null
  const year = startDate.getUTCFullYear()
  const month = startDate.getUTCMonth() + months
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return endOfDayJakarta(year, month, Math.min(startDate.getUTCDate(), lastDay))
}

export function overdueAfterOf(endDate: Date | null): Date | null {
  if (!endDate) return null
  return endOfDayJakarta(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth(),
    endDate.getUTCDate(),
  )
}

export function deriveLateDocument(input: {
  documentStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null
  now: Date
  limitDate: Date | null
  overdueAfter: Date | null
}): { state: LateDocumentState; urgency: LateDocumentUrgency } {
  const state: LateDocumentState = input.documentStatus ?? 'MISSING'
  if (state === 'APPROVED') return { state, urgency: 'ON_TIME' }
  if (input.overdueAfter && input.now > input.overdueAfter) {
    return { state, urgency: 'OVERDUE' }
  }
  if (input.limitDate && input.now > input.limitDate) {
    return { state, urgency: 'LATE' }
  }
  return { state, urgency: 'ON_TIME' }
}

export function compareByUrgency(
  a: { urgency: LateDocumentUrgency; registrationNumber: string },
  b: { urgency: LateDocumentUrgency; registrationNumber: string },
): number {
  return (
    URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency] ||
    a.registrationNumber.localeCompare(b.registrationNumber)
  )
}
