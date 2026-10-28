export interface ExamScore {
  id: string
  examSessionId: string
  enrollmentId: string
  studentId: string
  studentName: string | null
  studentNis: string | null
  subjectId: string
  gradeId: string
  classroomId: string
  semesterId: string
  examTitle: string
  rawScore: number
  maxScore: number
  score: number
  gradedAt: Date
  createdAt: Date
  updatedAt: Date
}

export type ExamScoreInput = Omit<ExamScore, 'id' | 'createdAt' | 'updatedAt'>
