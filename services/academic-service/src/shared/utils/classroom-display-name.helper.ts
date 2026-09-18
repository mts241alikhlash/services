interface ClassroomWithLevel {
  code?: string | null
  name?: string | null
  grade?: { name: string } | null
}

export function classroomDisplayName(classroom: ClassroomWithLevel): string {
  const code = classroom.code?.trim()
  const alias = classroom.name?.trim()
  const grade = classroom.grade?.name?.trim()

  const identity = code || [grade, alias].filter(Boolean).join(' ') || ''
  if (code && alias) return `${code} (${alias})`
  return identity
}

export function withDisplayName<T extends ClassroomWithLevel>(
  classroom: T,
): T & { displayName: string } {
  return { ...classroom, displayName: classroomDisplayName(classroom) }
}
