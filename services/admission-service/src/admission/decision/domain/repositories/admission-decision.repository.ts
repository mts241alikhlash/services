import type {
  DecisionQueueQuery,
  DecisionQueueResult,
} from '../entities/decision.entity.js'

export abstract class IAdmissionDecisionRepository {
  abstract findQueue(query: DecisionQueueQuery): Promise<DecisionQueueResult>
  abstract findStatus(applicationId: string): Promise<{ status: string } | null>
  abstract cancelAcceptance(applicationId: string): Promise<boolean>
  abstract cancelRejection(applicationId: string): Promise<boolean>
}
