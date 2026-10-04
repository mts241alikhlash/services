export const ALLOWED_UPLOAD_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
] as const

export const ACCEPTED_UPLOAD_FORMATS_LABEL = 'JPG, PNG, WebP, GIF, PDF'

export const OPTIMIZABLE_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const IMAGE_OPTIMIZATION_OPTIONS = {
  maxWidth: 2000,
  maxHeight: 2000,
  quality: 80,
} as const

export const SHARE_PREVIEW_OPTIONS = {
  width: 1200,
  height: 630,
  quality: 72,
} as const

export const SHARE_PREVIEW_SUFFIX = '.preview.jpg'

export function sharePreviewKey(storageKey: string): string {
  return `${storageKey}${SHARE_PREVIEW_SUFFIX}`
}
