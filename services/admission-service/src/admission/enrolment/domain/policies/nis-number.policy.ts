export class NisPolicyError extends Error {}

export interface NisCandidate {
  applicationId: string
  fullName: string
  registrationNumber: string
  gradeLevel: number | null
  currentNis: string | null
}

export interface NisAssignment {
  applicationId: string
  nis: string
  previous: string | null
}

export interface NisPlan {
  assignments: NisAssignment[]
  skipped: { applicationId: string; reason: string }[]
  changes: number
  created: number
}

const MAX_SEQUENCE = 999
const collator = new Intl.Collator('id', { sensitivity: 'base' })

export function schoolYearCode(name: string): string {
  const years = name.match(/\d{4}/g)
  if (!years || years.length < 2) {
    throw new NisPolicyError('Nama tahun ajaran tidak bisa dibaca untuk NIS')
  }
  return `${years[0].slice(2)}${years[1].slice(2)}`
}

export function compareByName(
  a: { fullName: string; registrationNumber: string },
  b: { fullName: string; registrationNumber: string },
): number {
  return (
    collator.compare(a.fullName.trim(), b.fullName.trim()) ||
    a.registrationNumber.localeCompare(b.registrationNumber)
  )
}

function sequenceOf(nis: string): number {
  const sequence = Number(nis.slice(-3))
  return Number.isFinite(sequence) ? sequence : 0
}

function format(
  yearCode: string,
  gradeLevel: number,
  sequence: number,
): string {
  if (sequence > MAX_SEQUENCE) {
    throw new NisPolicyError('Urutan NIS melebihi 999')
  }
  return `${yearCode}${String(gradeLevel).padStart(2, '0')}${String(sequence).padStart(3, '0')}`
}

export function planNis(input: {
  candidates: NisCandidate[]
  yearCode: string
  locked: boolean
}): NisPlan {
  const skipped = input.candidates
    .filter((candidate) => candidate.gradeLevel === null)
    .map((candidate) => ({
      applicationId: candidate.applicationId,
      reason: 'Tingkat kelas belum diisi',
    }))
  const eligible = input.candidates.filter(
    (candidate): candidate is NisCandidate & { gradeLevel: number } =>
      candidate.gradeLevel !== null,
  )

  const target = input.locked
    ? eligible.filter((candidate) => !candidate.currentNis)
    : eligible
  const first = input.locked
    ? Math.max(
        0,
        ...input.candidates.map((candidate) =>
          candidate.currentNis ? sequenceOf(candidate.currentNis) : 0,
        ),
      ) + 1
    : 1

  const assignments = [...target]
    .sort(compareByName)
    .map((candidate, index) => ({
      applicationId: candidate.applicationId,
      nis: format(input.yearCode, candidate.gradeLevel, first + index),
      previous: candidate.currentNis,
    }))

  return {
    assignments,
    skipped,
    changes: assignments.filter(
      (assignment) =>
        assignment.previous !== null && assignment.previous !== assignment.nis,
    ).length,
    created: assignments.filter((assignment) => assignment.previous === null)
      .length,
  }
}
