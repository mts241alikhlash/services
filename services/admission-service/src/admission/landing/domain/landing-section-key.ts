export const LANDING_SECTION_KEYS = [
  'hero',
  'life',
  'info',
  'steps',
  'faq',
  'stories',
  'closing',
] as const

export type LandingSectionKey = (typeof LANDING_SECTION_KEYS)[number]

export function isLandingSectionKey(value: string): value is LandingSectionKey {
  return (LANDING_SECTION_KEYS as readonly string[]).includes(value)
}
