import { BadRequestException } from '@nestjs/common'
import type {
  QuestionContent,
  QuestionType,
} from '../value-objects/question-content.js'
import { sanitizeQuestionHtml } from './sanitize-question-html.policy.js'
import { validateQuestionContent } from './validate-question-content.policy.js'

function hasContent(html: string): boolean {
  if (/<img\b|data-latex=/u.test(html)) return true
  return html.replace(/<[^>]*>|&nbsp;|\s/gu, '') !== ''
}

export interface PreparedQuestion {
  bodyHtml: string
  content: QuestionContent
}

export function prepareQuestion(
  type: QuestionType,
  bodyHtml: string,
  content: unknown,
): PreparedQuestion {
  const body = sanitizeQuestionHtml(bodyHtml)
  if (!hasContent(body)) throw new BadRequestException('Isi soal wajib diisi')

  const validated = validateQuestionContent(type, content)

  if ('choices' in validated) {
    const choices = validated.choices.map((choice) => {
      const html = sanitizeQuestionHtml(choice.html)
      if (!hasContent(html)) {
        throw new BadRequestException('Isi pilihan jawaban wajib diisi')
      }
      return { key: choice.key, html }
    })
    return { bodyHtml: body, content: { ...validated, choices } }
  }

  if ('guideHtml' in validated) {
    const guide =
      validated.guideHtml === null
        ? ''
        : sanitizeQuestionHtml(validated.guideHtml)
    return {
      bodyHtml: body,
      content: { guideHtml: hasContent(guide) ? guide : null },
    }
  }

  return { bodyHtml: body, content: validated }
}
