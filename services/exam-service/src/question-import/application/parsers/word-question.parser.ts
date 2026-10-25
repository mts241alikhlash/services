import { BadRequestException, HttpException } from '@nestjs/common'
import mammoth from 'mammoth'
import type {
  Choice,
  QuestionType,
} from '../../../question/domain/value-objects/question-content.js'
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
  subItem: boolean
}

interface Draft {
  row: number
  body: string[]
  choices: { key: Choice['key']; parts: string[] }[]
  choiceTrouble: boolean
  key: string | null
  jenis: string | null
  points: string | null
  ignoreHarakat: boolean
  finished: boolean
}

const KEYS = ['A', 'B', 'C', 'D', 'E'] as const

const TAG = /<(\/?)(ol|ul|li|p|h[1-6])(?:\s[^>]*)?>/gu
const META = /^(kunci|jenis|poin|abaikan harakat)\s*:\s*(.*)$/iu
const CHOICE = /^([A-Ea-e])[.)]\s*(.*)$/u
const LEADING_NUMBER = /^((?:<[^>]+>)*)\s*\d+[.)]\s+/u
const LEADING_CHOICE = /^((?:<[^>]+>)*)\s*[A-Ea-e][.)]\s*/u
const TEXT_NUMBER = /^\d+[.)]\s+/u
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

interface Open {
  tag: string
  start: number
  flushed: boolean
}

function toBlocks(html: string): Block[] {
  const blocks: Block[] = []
  const stack: Open[] = []

  const add = (inner: string, fromList: boolean, subItem: boolean) => {
    const trimmed = inner.trim()
    const text = decode(trimmed.replace(/<[^>]+>/gu, '')).trim()
    if (text === '' && !/<img\b/u.test(trimmed)) return
    blocks.push({ html: trimmed, text, fromList, subItem })
  }

  for (const match of html.matchAll(TAG)) {
    const closing = match[1] === '/'
    const tag = match[2] ?? ''
    const at = match.index
    const after = at + match[0].length
    const isList = tag === 'ol' || tag === 'ul'

    if (!closing) {
      if (isList) {
        const parent = [...stack].reverse().find((open) => open.tag === 'li')
        if (parent && !parent.flushed) {
          const depth = stack.filter((open) => open.tag === 'li').length
          add(html.slice(parent.start, at), true, depth > 1)
          parent.flushed = true
        }
      }
      stack.push({ tag, start: after, flushed: false })
      continue
    }

    const index = stack.map((open) => open.tag).lastIndexOf(tag)
    if (index < 0) continue
    const open = stack.splice(index)[0]
    if (!open || isList || open.flushed) continue
    const ancestors = stack.filter((item) => item.tag === 'li').length
    add(html.slice(open.start, at), tag === 'li', tag === 'li' && ancestors > 0)
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
    choiceTrouble: false,
    key: null,
    jenis: null,
    points: null,
    ignoreHarakat: false,
    finished: false,
  }
}

function resolveType(draft: Draft): QuestionType {
  if (draft.jenis !== null) {
    const name = draft.jenis.toLowerCase()
    if (!Object.hasOwn(JENIS_TYPES, name)) {
      throw new ImportRowError('Jenis soal tidak dikenal')
    }
    return JENIS_TYPES[name as keyof typeof JENIS_TYPES]
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
    if (draft.choiceTrouble || draft.choices.length === 1) {
      throw new ImportRowError(
        'Pilihan jawaban harus berurutan A, B, C dan seterusnya',
      )
    }
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

function addChoice(draft: Draft, html: string): void {
  const key = KEYS[draft.choices.length]
  if (!key) {
    draft.choiceTrouble = true
    return
  }
  draft.choices.push({ key, parts: [paragraph(html)] })
}

export function parseWordHtml(html: string): ParseResult {
  const result: ParseResult = { questions: [], errors: [] }
  let draft: Draft | null = null
  let count = 0

  for (const block of toBlocks(html)) {
    if (block.subItem) {
      if (draft && !draft.finished) addChoice(draft, block.html)
      continue
    }

    const meta = META.exec(block.text)
    if (meta && draft) {
      applyMeta(draft, meta[1] ?? '', meta[2] ?? '')
      continue
    }

    const choice = CHOICE.exec(block.text)
    if (choice && draft && !draft.finished) {
      const letter = (choice[1] ?? '').toUpperCase()
      if (letter === KEYS[draft.choices.length]) {
        addChoice(draft, block.html.replace(LEADING_CHOICE, '$1'))
      } else {
        draft.choiceTrouble = true
      }
      continue
    }

    const startsNumbered = !block.fromList && TEXT_NUMBER.test(block.text)
    if (!draft || block.fromList || draft.finished || startsNumbered) {
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

  return parseWordHtml(html)
}
