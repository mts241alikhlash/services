export interface ReadinessDocument {
  documentTypeId: string
  status: string
}

export interface ReadinessInput {
  status: string
  requiredTypeIds: string[]
  documents: ReadinessDocument[]
  paymentStatus: string | null
}

export function unapprovedRequiredTypeIds(
  requiredTypeIds: string[],
  documents: ReadinessDocument[],
): string[] {
  return requiredTypeIds.filter(
    (typeId) =>
      !documents.some(
        (document) =>
          document.documentTypeId === typeId && document.status === 'APPROVED',
      ),
  )
}

export function isReadyForVerification(input: ReadinessInput): boolean {
  return (
    input.status === 'SUBMITTED' &&
    input.paymentStatus === 'VERIFIED' &&
    unapprovedRequiredTypeIds(input.requiredTypeIds, input.documents)
      .length === 0
  )
}
