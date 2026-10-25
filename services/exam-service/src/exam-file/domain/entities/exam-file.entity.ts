export interface ExamFile {
  id: string
  storageKey: string
  mimeType: string
  sizeBytes: number
  originalName: string
  uploadedById: string
  createdAt: Date
}
