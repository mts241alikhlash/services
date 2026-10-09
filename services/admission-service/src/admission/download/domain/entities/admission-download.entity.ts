export interface AdmissionDownloadEntity {
  id: string
  title: string
  description: string | null
  fileKey: string
  fileName: string
  sizeBytes: number
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
