export interface SendType {
  id: string
  name: string
  isRequired: boolean
}

export interface SendDocument {
  documentTypeId: string
  status: string
  note: string | null
}

export type SendPlan =
  | { kind: 'BLOCKED' }
  | { kind: 'REVISION'; revisionNote: string }
  | { kind: 'APPROVED' }

export function planSend(
  types: SendType[],
  documents: SendDocument[],
  dataNote?: string,
): SendPlan {
  const note = dataNote?.trim() || undefined
  const documentOf = (typeId: string) =>
    documents.find((document) => document.documentTypeId === typeId)

  const undecided = types.filter(
    (type) =>
      type.isRequired &&
      (documentOf(type.id)?.status ?? 'PENDING') === 'PENDING',
  )
  if (!note && undecided.length > 0) return { kind: 'BLOCKED' }

  const rejected = types.flatMap((type) => {
    const document = documentOf(type.id)
    return document?.status === 'REJECTED'
      ? [{ name: type.name, note: document.note }]
      : []
  })
  if (rejected.length === 0 && !note) return { kind: 'APPROVED' }

  const parts: string[] = []
  if (rejected.length > 0) {
    parts.push(
      [
        'Berkas yang perlu diunggah ulang:',
        ...rejected.map((item) => `- ${item.name}: ${item.note ?? '-'}`),
      ].join('\n'),
    )
  }
  if (note) parts.push(`Catatan data: ${note}`)
  return { kind: 'REVISION', revisionNote: parts.join('\n\n') }
}
