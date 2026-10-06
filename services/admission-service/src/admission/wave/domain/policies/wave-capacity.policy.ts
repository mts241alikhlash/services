export const MOVABLE_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'REVISION_NEEDED',
  'VERIFIED',
] as const

export interface WaveCapacity {
  quota: number
  filledCount: number
}

export interface TargetCandidate extends WaveCapacity {
  id: string
  academicYearId: string
  startDate: Date
}

export function isWaveFull(wave: WaveCapacity): boolean {
  return wave.filledCount >= wave.quota
}

export function pickTargetWave<T extends TargetCandidate>(
  source: { id: string; academicYearId: string; startDate: Date },
  candidates: T[],
): T | null {
  return (
    candidates
      .filter(
        (candidate) =>
          candidate.id !== source.id &&
          candidate.academicYearId === source.academicYearId &&
          candidate.startDate.getTime() > source.startDate.getTime() &&
          !isWaveFull(candidate),
      )
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0] ?? null
  )
}
