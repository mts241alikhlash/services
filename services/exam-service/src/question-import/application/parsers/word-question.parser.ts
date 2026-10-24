import { BadRequestException, HttpException } from '@nestjs/common'
import mammoth from 'mammoth'
import type { Choice } from '../../../question/domain/value-objects/question-content.js'
import type { QuestionType } from '../../../question/domain/value-objects/question-content.js'
import { JENIS_TYPES, type ParseResult } from '../../domain/parsed-question.js'
import {
  buildImportContent,
  ImportRowError,
  parsePoints,
} from '../../domain/policies/import-content.policy.js'
import { inlineToHtml } from '../../domain/policies/inline-latex.policy.js'

export type ImageSaver = (
  content: Buffer,
  contentType: string,
) => Promise<string>

interface Block {
  html: string
  text: string
  fromList: boolean
}

interface Draft {
  row: number
  body: string[]
  choices: { key: Choice['key']; parts: string[] }[]
  key: string | null
  jenis: string | null
  points: string | null
  ignoreHarakat: boolean
  finished: boolean
}

const BLOCK = /<(p|li|h[1-6])(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gu
const META = /^(kunci|jenis|poin|abaikan harakat)\s*:\s*(.*)$/iu
const CHOICE = /^([A-E])[.)]\s*(.*)$/u
const LEADING_NUMBER = /^((?:<[^>]+>)*)\s*\d+[.)]\s+/u
const LEADING_CHOICE = /^((?:<[^>]+>)*)\s*[A-E][.)]\s*/u
const MULTI_KEY = /[A-E]\s*[,;\s]\s*[A-E]/iu
const BOOLEAN_KEY = /^(benar|salah|true|false)$/iu

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
}

function decode(text: string): string {
  return text.replace(
    /&(?:amp|lt|gt|quot|#39);/gu,
    (entity) => ENTITIES[entity] ?? entity,
  )
}

function toBlocks(html: string): Block[] {
  const blocks: Block[] = []
  for (const match of html.matchAll(BLOCK)) {
    const inner = (match[2] ?? '').trim()
    const text = decode(inner.replace(/<[^>]+>/gu, '')).trim()
    if (text === '' && !/<img\b/u.test(inner)) continue
    blocks.push({ html: inner, text, fromList: match[1] === 'li' })
  }
  return blocks
}

function paragraph(html: string): string {
  return `<p dir="auto">${inlineToHtml(html)}</p>`
}

function newDraft(row: number, block: Block): Draft {
  return {
    row,
    body: [paragraph(block.html.replace(LEADING_NUMBER, '$1'))],
    choices: [],
    key: null,
    jenis: null,
    points: null,
    ignoreHarakat: false,
    finished: false,
  }
}

function resolveType(draft: Draft): QuestionType {
  if (draft.jenis !== null) {
    const type =
      JENIS_TYPES[draft.jenis.toLowerCase() as keyof typeof JENIS_TYPES]
    if (type === undefined) throw new ImportRowError('Jenis soal tidak dikenal')
    return type
  }
  const key = draft.key ?? ''
  if (draft.choices.length >= 2) {
    return MULTI_KEY.test(key) ? 'MULTIPLE_RESPONSE' : 'MULTIPLE_CHOICE'
  }
  if (draft.key === null) return 'ESSAY'
  return BOOLEAN_KEY.test(key.trim()) ? 'TRUE_FALSE' : 'SHORT_ANSWER'
}

function finish(draft: Draft, result: ParseResult): void {
  try {
    const type = resolveType(draft)
    result.questions.push({
      row: draft.row,
      type,
      bodyHtml: draft.body.join(''),
      content: buildImportContent(type, {
        choices: draft.choices.map((choice) => ({
          key: choice.key,
          html: choice.parts.join(''),
        })),
        key: draft.key ?? '',
        ignoreHarakat: draft.ignoreHarakat,
      }),
      points: parsePoints(draft.points ?? ''),
    })
  } catch (error) {
    if (!(error instanceof ImportRowError)) throw error
    result.errors.push({ row: draft.row, reason: error.message })
  }
}

function applyMeta(draft: Draft, name: string, value: string): void {
  draft.finished = true
  switch (name.toLowerCase()) {
    case 'kunci':
      draft.key = value
      break
    case 'jenis':
      draft.jenis = value
      break
    case 'poin':
      draft.points = value
      break
    default:
      draft.ignoreHarakat = value.toLowerCase() === 'ya'
  }
}

export async function parseWordQuestions(
  buffer: Buffer,
  saveImage: ImageSaver,
): Promise<ParseResult> {
  let html: string
  try {
    const converted = await mammoth.convertToHtml(
      { buffer },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          const id = await saveImage(
            await image.readAsBuffer(),
            image.contentType,
          )
          return { 'data-file-id': id } as unknown as { src: string }
        }),
      },
    )
    html = converted.value
  } catch (error) {
    if (error instanceof HttpException) throw error
    throw new BadRequestException('Berkas Word tidak bisa dibaca')
  }

  const result: ParseResult = { questions: [], errors: [] }
  let draft: Draft | null = null
  let count = 0

  for (const block of toBlocks(html)) {
    const meta = META.exec(block.text)
    if (meta && draft) {
      applyMeta(draft, meta[1] ?? '', meta[2] ?? '')
      continue
    }

    const choice = CHOICE.exec(block.text)
    if (
      choice &&
      draft &&
      !draft.finished &&
      choice[1] === String.fromCharCode(65 + draft.choices.length)
    ) {
      draft.choices.push({
        key: choice[1] as Choice['key'],
        parts: [paragraph(block.html.replace(LEADING_CHOICE, '$1'))],
      })
      continue
    }

    if (!draft || block.fromList || draft.finished) {
      if (draft) finish(draft, result)
      draft = newDraft(++count, block)
      continue
    }

    const last = draft.choices.at(-1)
    ;(last ? last.parts : draft.body).push(paragraph(block.html))
  }
  if (draft) finish(draft, result)

  return result
}
