export const LIFE_STATUS_ALIVE = 'Masih hidup'

interface ParentFacts {
  relation: string
  name: string | null
  nik: string | null
  birthPlace: string | null
  birthDate: Date | string | null
  occupationId: string | null
  phone: string | null
  lifeStatusId: string | null
  isPrimary: boolean | null
}

const WHO: Record<string, string> = {
  FATHER: 'ayah',
  MOTHER: 'ibu',
  GUARDIAN: 'wali',
}

const GUARDIAN_FIELDS: [keyof ParentFacts, string][] = [
  ['name', 'Nama'],
  ['nik', 'NIK'],
  ['birthPlace', 'Tempat lahir'],
  ['birthDate', 'Tanggal lahir'],
  ['occupationId', 'Pekerjaan'],
  ['phone', 'No. HP'],
]

export function parentGaps(
  parents: ParentFacts[],
  studentNik: string | null,
  statusName: (id: string | null) => string | undefined,
): string[] {
  const gaps: string[] = []

  const guardian = parents.find((parent) => parent.isPrimary)
  if (!guardian) {
    gaps.push('Wali santri')
  } else {
    for (const [field, label] of GUARDIAN_FIELDS) {
      if (!guardian[field]) gaps.push(`${label} wali`)
    }
    if (
      guardian.relation !== 'GUARDIAN' &&
      statusName(guardian.lifeStatusId) !== LIFE_STATUS_ALIVE
    ) {
      gaps.push('Wali harus ayah/ibu yang masih hidup atau orang lain')
    }
  }

  for (const parent of parents) {
    if (
      parent.relation !== 'GUARDIAN' &&
      !parent.isPrimary &&
      !parent.nik &&
      statusName(parent.lifeStatusId) === LIFE_STATUS_ALIVE
    ) {
      gaps.push(`NIK ${WHO[parent.relation]}`)
    }
  }

  const owners = [
    ['santri', studentNik],
    ...parents.map((parent) => [WHO[parent.relation], parent.nik]),
  ].filter((owner): owner is [string, string] => Boolean(owner[1]))
  owners.forEach(([who, nik], at) => {
    for (const [other, otherNik] of owners.slice(at + 1)) {
      if (nik === otherNik) gaps.push(`NIK ${who} sama dengan NIK ${other}`)
    }
  })

  return gaps
}
