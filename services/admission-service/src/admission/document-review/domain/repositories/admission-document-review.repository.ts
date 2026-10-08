import type {
  ReviewContext,
  ReviewQueueQuery,
  ReviewQueueResult,
  SaveDecisionInput,
  SaveDecisionResult,
} from '../entities/document-review.entity.js'

export abstract class IAdmissionDocumentReviewRepository {
  abstract findQueue(query: ReviewQueueQuery): Promise<ReviewQueueResult>
  abstract findContext(applicationId: string): Promise<ReviewContext | null>
  abstract saveDecision(input: SaveDecisionInput): Promise<SaveDecisionResult>
  abstract recordApproval(applicationId: string): Promise<boolean>
  abstract markRevisionNeeded(
    applicationId: string,
    note: string,
  ): Promise<boolean>
}
