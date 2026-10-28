export interface PublicationCandidate {
  sessionId: string
  attempts: number
  lastAttemptAt: Date | null
}

export abstract class IScorePublicationRepository {
  abstract findCandidates(
    limit: number,
    excludeSessionIds: string[],
  ): Promise<PublicationCandidate[]>
  abstract markSent(
    sessionId: string,
    at: Date,
    gradedAt: Date | null,
  ): Promise<void>
  abstract markFailed(
    sessionId: string,
    at: Date,
    reason: string,
    permanent: boolean,
    gradedAt: Date | null,
  ): Promise<void>
}
