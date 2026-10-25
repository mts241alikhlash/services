import type { ShortAnswerContent } from '../value-objects/question-content.js'

const HARAKAT = /[ً-ْٰـ]/gu

function normalize(
  text: string,
  options: { ignoreCase: boolean; ignoreHarakat: boolean },
): string {
  let value = text.normalize('NFC').replace(/\s+/gu, ' ').trim()
  if (options.ignoreHarakat) value = value.replace(HARAKAT, '')
  if (options.ignoreCase) value = value.toLocaleLowerCase('id-ID')
  return value
}

export function matchShortAnswer(
  given: string,
  answer: ShortAnswerContent['answer'],
): boolean {
  const options = {
    ignoreCase: answer.ignoreCase,
    ignoreHarakat: answer.ignoreHarakat,
  }
  const value = normalize(given, options)
  if (value === '') return false
  return answer.accepted.some((item) => normalize(item, options) === value)
}
