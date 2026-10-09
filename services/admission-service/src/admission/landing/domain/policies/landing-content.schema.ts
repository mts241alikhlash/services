import { BadRequestException } from '@nestjs/common'
import { z } from 'zod'
import {
  isLandingSectionKey,
  type LandingSectionKey,
} from '../landing-section-key.js'

const text = (max: number) => z.string().trim().min(1).max(max)
const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((value) => (value ? value : null))
const lines = (maxLines: number, maxLength: number) =>
  z.array(text(maxLength)).min(1).max(maxLines)

const imageRef = z.union([
  z.object({ imageId: z.uuid() }).strict(),
  z.object({ src: z.string().regex(/^\/hero\/[a-z0-9-]+\.webp$/) }).strict(),
])

const hero = z
  .object({
    eyebrow: text(100),
    titleLines: lines(3, 60),
    description: text(300),
    registerLabel: text(40),
    guideLabel: text(40),
    exploreLabel: text(80),
    photoNoteLines: lines(3, 40),
    schoolPhoto: z
      .object({ image: imageRef, alt: text(200), caption: text(120) })
      .strict(),
    studyPhoto: z
      .object({
        image: imageRef,
        alt: text(200),
        title: text(60),
        tag: text(40),
      })
      .strict(),
  })
  .strict()

const life = z
  .object({
    label: text(80),
    titleLines: lines(3, 40),
    description: text(300),
    footnote: text(100),
    linkLabel: text(40),
    photos: z
      .array(
        z
          .object({
            image: imageRef,
            alt: text(200),
            title: text(60),
            caption: text(160),
          })
          .strict(),
      )
      .min(1)
      .max(12),
  })
  .strict()

const info = z
  .object({
    title: text(80),
    description: text(300),
    posters: z
      .array(
        z
          .object({
            image: imageRef,
            alt: text(200),
            caption: nullableText(120),
          })
          .strict(),
      )
      .max(10),
  })
  .strict()

const steps = z
  .object({
    title: text(80),
    description: text(300),
    items: z
      .array(z.object({ title: text(60), description: text(200) }).strict())
      .min(3)
      .max(5),
  })
  .strict()

const faq = z
  .object({
    title: text(80),
    description: text(200),
    items: z
      .array(z.object({ question: text(150), answer: text(600) }).strict())
      .min(1)
      .max(15),
  })
  .strict()

const stories = z
  .object({
    label: text(80),
    title: text(80),
    description: text(250),
    items: z
      .array(
        z
          .object({
            kind: text(40),
            quote: text(500),
            name: text(60),
            position: nullableText(80),
            tags: z.array(text(60)).max(3),
            photo: imageRef.nullable(),
          })
          .strict(),
      )
      .max(8),
  })
  .strict()

const closing = z
  .object({
    title: text(100),
    description: text(250),
    registerLabel: text(40),
    requirementsLabel: text(60),
    photo: z.object({ image: imageRef, alt: text(200) }).strict(),
  })
  .strict()

export const LANDING_SECTION_SCHEMAS = {
  hero,
  life,
  info,
  steps,
  faq,
  stories,
  closing,
} as const

export type LandingSectionDocuments = {
  [Key in LandingSectionKey]: z.infer<(typeof LANDING_SECTION_SCHEMAS)[Key]>
}

export type LandingSectionDocument = LandingSectionDocuments[LandingSectionKey]

export function parseLandingSection(
  key: string,
  input: unknown,
): LandingSectionDocument {
  if (!isLandingSectionKey(key)) {
    throw new BadRequestException('Bagian halaman depan tidak dikenal')
  }
  const result = LANDING_SECTION_SCHEMAS[key].safeParse(input)
  if (!result.success) {
    const issue = result.error.issues[0]
    const path = issue.path.join('.')
    throw new BadRequestException(
      path
        ? `Isi tidak valid di ${path}: ${issue.message}`
        : `Isi tidak valid: ${issue.message}`,
    )
  }
  return result.data
}

export function collectImageIds(document: unknown): string[] {
  const ids: string[] = []
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>
      if (typeof record.imageId === 'string') ids.push(record.imageId)
      Object.values(record).forEach(visit)
    }
  }
  visit(document)
  return [...new Set(ids)]
}
