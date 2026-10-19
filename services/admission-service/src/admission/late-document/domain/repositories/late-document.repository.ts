import type { LateDocumentPair } from '../late-document.entity.js'

export abstract class ILateDocumentRepository {
  abstract resolvePpdbYearId(): Promise<string | null>
  abstract findTrackedPairs(academicYearId: string): Promise<LateDocumentPair[]>
  abstract findPair(
    applicationId: string,
    documentTypeId: string,
  ): Promise<LateDocumentPair | null>
}
