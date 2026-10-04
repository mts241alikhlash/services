export interface AdmissionFileRef {
  id: string
  filename: string
  originalName: string
  mimeType: string
  sizeBytes: number
  storageKey: string
}

export interface AdmissionUploadFile {
  buffer: Buffer
  originalname: string
  mimetype: string
  size: number
}

export interface AdmissionStoredFile {
  filename: string
  storageKey: string
}
