import { BadRequestException } from '@nestjs/common'
import {
  CHOICE_KEYS,
  type Choice,
  type ChoiceKey,
  type QuestionContent,
  type QuestionType,
} from '../value-objects/question-content.js'

const MIN_CHOICES = 2
const MAX_CHOICES = 5

function fail(message: string): never {
  throw new BadRequestException(message)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isChoiceKey(value: unknown): value is ChoiceKey {
  return CHOICE_KEYS.includes(value as ChoiceKey)
}

function readChoices(value: unknown): Choice[] {
  if (!Array.isArray(value)) fail('Pilihan jawaban wajib diisi')
  if (value.length < MIN_CHOICES || value.length > MAX_CHOICES) {
    fail(`Pilihan jawaban harus ${MIN_CHOICES} sampai ${MAX_CHOICES}`)
  }
  const seen = new Set<string>()
  return value.map((entry): Choice => {
    if (!isRecord(entry) || !isChoiceKey(entry.key)) {
      fail('Kunci pilihan harus A sampai E')
    }
    if (typeof entry.html !== 'string' || entry.html.trim() === '') {
      fail('Isi pilihan jawaban wajib diisi')
    }
    if (seen.has(entry.key)) fail('Kunci pilihan tidak boleh sama')
    seen.add(entry.key)
    return { key: entry.key, html: entry.html }
  })
}

function readAnswer(content: Record<string, unknown>): Record<string, unknown> {
  const answer = content.answer
  if (!isRecord(answer)) fail('Kunci jawaban wajib diisi')
  return answer
}

function onlyKeys(content: Record<string, unknown>, allowed: string[]): void {
  const extra = Object.keys(content).filter((key) => !allowed.includes(key))
  if (extra.length > 0) fail('Isi soal tidak sesuai jenis soal')
}

export function validateQuestionContent(
  type: QuestionType,
  content: unknown,
): QuestionContent {
  if (!isRecord(content)) fail('Isi soal wajib diisi')

  switch (type) {
    case 'MULTIPLE_CHOICE': {
      onlyKeys(content, ['choices', 'answer'])
      const choices = readChoices(content.choices)
      const key = readAnswer(content).key
      if (!isChoiceKey(key) || !choices.some((choice) => choice.key === key)) {
        fail('Kunci jawaban harus salah satu pilihan')
      }
      return { choices, answer: { key } }
    }
    case 'MULTIPLE_RESPONSE': {
      onlyKeys(content, ['choices', 'answer'])
      const choices = readChoices(content.choices)
      const keys = readAnswer(content).keys
      if (!Array.isArray(keys) || keys.length === 0) {
        fail('Pilih minimal satu kunci jawaban')
      }
      const unique = [...new Set(keys)]
      if (
        !unique.every(
          (key): key is ChoiceKey =>
            isChoiceKey(key) && choices.some((choice) => choice.key === key),
        )
      ) {
        fail('Kunci jawaban harus salah satu pilihan')
      }
      return { choices, answer: { keys: unique } }
    }
    case 'TRUE_FALSE': {
      onlyKeys(content, ['answer'])
      const value = readAnswer(content).value
      if (typeof value !== 'boolean')
        fail('Kunci jawaban harus benar atau salah')
      return { answer: { value } }
    }
    case 'SHORT_ANSWER': {
      onlyKeys(content, ['answer'])
      const answer = readAnswer(content)
      const given = answer.accepted
      if (
        !Array.isArray(given) ||
        given.some((item) => typeof item !== 'string')
      ) {
        fail('Isian singkat butuh minimal satu jawaban benar')
      }
      const accepted = (given as string[])
        .map((item) => item.trim())
        .filter((item) => item !== '')
      if (accepted.length === 0) {
        fail('Isian singkat butuh minimal satu jawaban benar')
      }
      return {
        answer: {
          accepted,
          ignoreCase: answer.ignoreCase !== false,
          ignoreHarakat: answer.ignoreHarakat === true,
        },
      }
    }
    case 'ESSAY': {
      onlyKeys(content, ['guideHtml'])
      const guide = content.guideHtml
      if (guide !== null && guide !== undefined && typeof guide !== 'string') {
        fail('Pedoman penilaian harus berupa teks')
      }
      return { guideHtml: typeof guide === 'string' ? guide : null }
    }
  }
}
