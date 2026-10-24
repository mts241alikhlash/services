import type { QuestionStatus } from '../value-objects/question-content.js'

export type VersionAction = 'edit-in-place' | 'new-version'

export function nextVersionAction(status: QuestionStatus): VersionAction {
  return status === 'APPROVED' ? 'new-version' : 'edit-in-place'
}
