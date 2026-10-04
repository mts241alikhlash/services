export interface ResolveBulkImportConflictItemInput {
  existingId?: string
  action: 'update' | 'skip'
  data: {
    identifier: string
    password?: string
    name: string
    nik: string
    gender?: string
    birthPlace: string
    birthDate: string
    email?: string
    phone?: string
    nip?: string
    nuptk?: string
    employmentTypeCode: string
  }
}

export interface ResolveBulkImportConflictsInput {
  conflicts: ResolveBulkImportConflictItemInput[]
}
