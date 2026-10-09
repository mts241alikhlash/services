import { BadRequestException } from '@nestjs/common'
import { MAX_UPLOAD_BYTES } from '../../../../core/upload/upload-limits.js'

export const PDF_REJECTED = 'Berkas harus PDF dan maksimal 5 MB'

const PDF_HEADER = '%PDF-'
const FALLBACK_NAME = 'berkas.pdf'
const MAX_NAME_LENGTH = 255

export interface PdfUpload {
  buffer: Buffer
  originalname: string
}

export interface StoredPdf {
  content: Buffer
  fileName: string
  sizeBytes: number
}

function cleanName(raw: string) {
  const restored = Buffer.from(raw, 'latin1').toString('utf8')
  const base = restored.split(/[\\/]/).pop()?.trim() ?? ''
  return (base || FALLBACK_NAME).slice(0, MAX_NAME_LENGTH)
}

export function toStoredPdf(upload: PdfUpload | undefined): StoredPdf {
  const content = upload?.buffer
  if (
    !upload ||
    !content ||
    content.length === 0 ||
    content.length > MAX_UPLOAD_BYTES ||
    content.subarray(0, PDF_HEADER.length).toString('latin1') !== PDF_HEADER
  ) {
    throw new BadRequestException(PDF_REJECTED)
  }
  return {
    content,
    fileName: cleanName(upload.originalname),
    sizeBytes: content.length,
  }
}
