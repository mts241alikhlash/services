interface GuardianCandidate {
  relation: string
  isPrimary?: boolean
}

export function settleGuardian<T extends GuardianCandidate>(parents: T[]): T[] {
  const chosen =
    parents.find((parent) => parent.isPrimary)?.relation ??
    (parents.some((parent) => parent.relation === 'GUARDIAN')
      ? 'GUARDIAN'
      : 'FATHER')
  return parents
    .filter((parent) => parent.relation !== 'GUARDIAN' || chosen === 'GUARDIAN')
    .map((parent) => ({ ...parent, isPrimary: parent.relation === chosen }))
}
