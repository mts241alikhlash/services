import { collectImageIds } from './landing-content.schema.js'

export const UNUSED_IMAGE_MIN_AGE_MS = 24 * 60 * 60 * 1000

export function findUnusedImages(
  images: { id: string; createdAt: Date }[],
  documents: unknown[],
  now: Date,
): string[] {
  const used = new Set(
    documents.flatMap((document) => collectImageIds(document)),
  )
  const cutoff = now.getTime() - UNUSED_IMAGE_MIN_AGE_MS
  return images
    .filter(
      (image) => !used.has(image.id) && image.createdAt.getTime() <= cutoff,
    )
    .map((image) => image.id)
}
