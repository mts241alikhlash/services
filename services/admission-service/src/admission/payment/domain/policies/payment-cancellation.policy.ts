export const CANCELLABLE_APPLICATION_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'REVISION_NEEDED',
  'VERIFIED',
] as const

export function canCancelVerification(status: string): boolean {
  return (CANCELLABLE_APPLICATION_STATUSES as readonly string[]).includes(
    status,
  )
}
