export interface DocumentSummary {
  approved: number
  rejected: number
  pending: number
  missing: number
  total: number
}

export function summarizeDocuments(
  requiredTypeIds: string[],
  documents: { documentTypeId: string; status: string }[],
): DocumentSummary {
  const summary: DocumentSummary = {
    approved: 0,
    rejected: 0,
    pending: 0,
    missing: 0,
    total: requiredTypeIds.length,
  }
  for (const typeId of requiredTypeIds) {
    const status = documents.find(
      (document) => document.documentTypeId === typeId,
    )?.status
    if (status === 'APPROVED') summary.approved++
    else if (status === 'REJECTED') summary.rejected++
    else if (status === 'PENDING') summary.pending++
    else summary.missing++
  }
  return summary
}
