export type QuestionMarker = 'NEW' | 'CHANGED' | 'COPIED'

export function questionMarker(question: {
  copiedFromQuestionId: string | null
  currentVersion: number
}): QuestionMarker {
  if (question.copiedFromQuestionId === null) return 'NEW'
  return question.currentVersion === 1 ? 'COPIED' : 'CHANGED'
}
