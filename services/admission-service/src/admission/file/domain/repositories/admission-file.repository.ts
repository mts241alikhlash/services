export interface ServableFile {
  id: string
  originalName: string
  mimeType: string
  storageKey: string
}

export abstract class IAdmissionFileRepository {
  abstract findServable(fileId: string): Promise<ServableFile | null>
}
