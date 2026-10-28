export interface ExamScorePayload {
  examSessionId: string
  enrollmentId: string
  studentId: string
  subjectId: string
  gradeId: string
  classroomId: string
  semesterId: string
  examTitle: string
  rawScore: number
  maxScore: number
  score: number
  gradedAt: string
}

export type PublishOutcome =
  | { result: 'SENT' }
  | { result: 'RETRY'; reason: string }
  | { result: 'REJECTED'; reason: string }

export abstract class IScorePublisherPort {
  abstract publish(payload: ExamScorePayload): Promise<PublishOutcome>
}
