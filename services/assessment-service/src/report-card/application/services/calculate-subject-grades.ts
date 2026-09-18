import { AssessmentType } from '@prisma/client'

export interface ScoredAssessment {
  type: AssessmentType
  itemWeight: number
  maxScore: number
  score: number
}

export interface SubjectGradeInput {
  subjectId: string
  subjectCode: string | null
  subjectName: string
  passingScore: number
  typeWeights: Partial<Record<AssessmentType, number>>
  assessments: ScoredAssessment[]
}

export interface SubjectGradeRow {
  no: number
  subjectId: string
  code: string
  name: string
  score: string
  scoreValue: number
  passingScore: number
  predicate: string
  description: string
  isComplete: boolean
}

const PREDICATE_DESCRIPTIONS = {
  A: 'Sangat Baik',
  B: 'Baik',
  C: 'Cukup',
  D: 'Kurang',
} as const

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function predicateFor(
  score: number,
  passingScore: number,
): { predicate: keyof typeof PREDICATE_DESCRIPTIONS; isComplete: boolean } {
  const safePassingScore = Math.min(Math.max(passingScore, 0), 100)
  if (score < safePassingScore) return { predicate: 'D', isComplete: false }

  const interval = (100 - safePassingScore) / 3
  if (interval <= 0) return { predicate: 'A', isComplete: true }

  if (score < safePassingScore + interval)
    return { predicate: 'C', isComplete: true }
  if (score < safePassingScore + interval * 2)
    return { predicate: 'B', isComplete: true }
  return { predicate: 'A', isComplete: true }
}

function scoreForType(assessments: ScoredAssessment[]): number | null {
  let weighted = 0
  let totalWeight = 0

  for (const assessment of assessments) {
    if (assessment.maxScore <= 0 || assessment.itemWeight <= 0) continue
    const percentage = (assessment.score / assessment.maxScore) * 100
    weighted += percentage * assessment.itemWeight
    totalWeight += assessment.itemWeight
  }

  return totalWeight > 0 ? weighted / totalWeight : null
}

export function calculateSubjectScore(input: SubjectGradeInput): number | null {
  const byType = new Map<AssessmentType, ScoredAssessment[]>()
  for (const assessment of input.assessments) {
    const bucket = byType.get(assessment.type)
    if (bucket) bucket.push(assessment)
    else byType.set(assessment.type, [assessment])
  }

  let weighted = 0
  let totalWeight = 0

  for (const [type, assessments] of byType) {
    const typeWeight = input.typeWeights[type] ?? 0
    if (typeWeight <= 0) continue

    const typeScore = scoreForType(assessments)
    if (typeScore === null) continue

    weighted += typeScore * typeWeight
    totalWeight += typeWeight
  }

  return totalWeight > 0 ? weighted / totalWeight : null
}

export function calculateSubjectGrades(
  subjects: SubjectGradeInput[],
): SubjectGradeRow[] {
  const rows: SubjectGradeRow[] = []

  for (const subject of subjects) {
    const raw = calculateSubjectScore(subject)
    if (raw === null) continue

    const scoreValue = round2(raw)
    const { predicate, isComplete } = predicateFor(
      scoreValue,
      subject.passingScore,
    )

    rows.push({
      no: rows.length + 1,
      subjectId: subject.subjectId,
      code: subject.subjectCode ?? '',
      name: subject.subjectName,
      score: scoreValue.toFixed(2),
      scoreValue,
      passingScore: subject.passingScore,
      predicate,
      description: PREDICATE_DESCRIPTIONS[predicate],
      isComplete,
    })
  }

  return rows
}

export function calculateTotalAverage(rows: SubjectGradeRow[]): number | null {
  if (rows.length === 0) return null
  const total = rows.reduce((sum, row) => sum + row.scoreValue, 0)
  return round2(total / rows.length)
}
