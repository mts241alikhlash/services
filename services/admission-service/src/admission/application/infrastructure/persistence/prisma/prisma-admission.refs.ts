import {
  IReferenceLookupPort,
  NamedRef,
} from '../../../../../platform/reference-lookup/reference-lookup.port.js'

export async function resolveAcademicYearNames(
  referenceLookup: IReferenceLookupPort,
  ids: (string | null | undefined)[],
): Promise<Map<string, { id: string; name: string }>> {
  const rows = await referenceLookup.listAcademicYears(present(ids))
  return new Map(rows.map((row) => [row.id, row]))
}

export async function resolveParentReferenceNames(
  referenceLookup: IReferenceLookupPort,
  occupationIds: (string | null | undefined)[],
  educationIds: (string | null | undefined)[],
): Promise<{
  occupations: Map<string, { id: string; name: string }>
  educations: Map<string, { id: string; name: string }>
}> {
  const [occupations, educations] = await Promise.all([
    referenceLookup.listOccupations(present(occupationIds)),
    referenceLookup.listEducations(present(educationIds)),
  ])
  return {
    occupations: new Map(occupations.map((row) => [row.id, row])),
    educations: new Map(educations.map((row) => [row.id, row])),
  }
}

function present(ids: (string | null | undefined)[]): string[] {
  return ids.filter((id): id is string => typeof id === 'string')
}

export async function attachWaveAcademicYear<
  T extends { wave?: { academicYearId: string } | null } | null,
>(application: T, referenceLookup: IReferenceLookupPort): Promise<T> {
  if (!application?.wave) return application
  const years = await resolveAcademicYearNames(referenceLookup, [
    application.wave.academicYearId,
  ])
  return {
    ...application,
    wave: {
      ...application.wave,
      academicYear: years.get(application.wave.academicYearId) ?? null,
    },
  }
}

export interface ParentReferenceRow {
  occupationId: string | null
  educationId: string | null
}

export interface ParentWithReferences {
  occupation: NamedRef | null
  education: NamedRef | null
}

export type WithParentReferences<T> = T extends null
  ? null
  : T extends { parents: infer P }
    ? Omit<T, 'parents'> & {
        parents: P extends (infer Row)[] ? (Row & ParentWithReferences)[] : P
      }
    : T

export async function attachParentReferences<
  T extends { parents?: ParentReferenceRow[] } | null,
>(
  application: T,
  referenceLookup: IReferenceLookupPort,
): Promise<WithParentReferences<T>> {
  if (!application?.parents?.length) {
    return application as WithParentReferences<T>
  }

  const { occupations, educations } = await resolveParentReferenceNames(
    referenceLookup,
    application.parents.map((parent) => parent.occupationId),
    application.parents.map((parent) => parent.educationId),
  )

  return {
    ...application,
    parents: application.parents.map((parent) => ({
      ...parent,
      occupation: parent.occupationId
        ? (occupations.get(parent.occupationId) ?? null)
        : null,
      education: parent.educationId
        ? (educations.get(parent.educationId) ?? null)
        : null,
    })),
  } as WithParentReferences<T>
}
