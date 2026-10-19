import { IReferenceLookupPort } from '../../../platform/reference-lookup/reference-lookup.port.js'
import { limitDateOf } from '../../late-document/domain/late-document.policy.js'

interface DueDateType {
  requirement: string
  lateDueMonths: number | null
}

export async function withDueDates<T extends DueDateType>(
  types: T[],
  academicYearId: string | undefined,
  lookup: IReferenceLookupPort,
): Promise<(T & { dueDate: string | null })[]> {
  const needsDate = types.some((type) => type.requirement === 'LATER')
  let startDate: Date | null = null
  if (needsDate && academicYearId) {
    try {
      startDate =
        (await lookup.firstSemesterOf(academicYearId))?.startDate ?? null
    } catch {
      startDate = null
    }
  }
  return types.map((type) => ({
    ...type,
    dueDate:
      type.requirement === 'LATER'
        ? (limitDateOf(startDate, type.lateDueMonths)?.toISOString() ?? null)
        : null,
  }))
}
