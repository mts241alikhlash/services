export interface AdmissionAnnouncementEntity {
  id: string
  title: string
  content: string
  publishDate?: Date
  publishedAt?: Date | null
  waveId: string | null
  isPublished?: boolean
  deletedAt?: Date | null
  createdById?: string | null
  createdAt?: Date
  updatedAt?: Date
}
