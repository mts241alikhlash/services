import {
  LANDING_SECTION_KEYS,
  type LandingSectionKey,
} from '../landing-section-key.js'

export interface LandingSectionRecord {
  key: string
  published: unknown
  draft: unknown
  publishedAt: Date | null
  publishedById: string | null
  draftUpdatedAt: Date | null
  draftUpdatedById: string | null
}

export interface LandingImageEntity {
  id: string
  fileKey: string
  width: number
  height: number
  sizeBytes: number
  createdAt: Date
  createdById: string
}

export interface LandingOverview {
  sections: Record<LandingSectionKey, unknown>
  hasUnpublishedChanges: boolean
  publishedAt: Date | null
}

export function publishedSections(
  records: LandingSectionRecord[],
): Record<LandingSectionKey, unknown> {
  return Object.fromEntries(
    LANDING_SECTION_KEYS.map((key) => [
      key,
      records.find((record) => record.key === key)?.published ?? null,
    ]),
  ) as Record<LandingSectionKey, unknown>
}

export function buildOverview(
  records: LandingSectionRecord[],
): LandingOverview {
  const sections = Object.fromEntries(
    LANDING_SECTION_KEYS.map((key) => {
      const record = records.find((row) => row.key === key)
      return [key, record?.draft ?? record?.published ?? null]
    }),
  ) as Record<LandingSectionKey, unknown>
  const publishedTimes = records
    .map((record) => record.publishedAt?.getTime())
    .filter((time): time is number => time !== undefined)
  return {
    sections,
    hasUnpublishedChanges: records.some((record) => record.draft != null),
    publishedAt: publishedTimes.length
      ? new Date(Math.max(...publishedTimes))
      : null,
  }
}
