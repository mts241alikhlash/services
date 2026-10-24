import { BadRequestException } from '@nestjs/common'
import { validateQuestionContent } from './validate-question-content.policy.js'

const choices = (keys: string[]) =>
  keys.map((key) => ({ key, html: `<p>Pilihan ${key}</p>` }))

describe('validateQuestionContent', () => {
  it('accepts multiple choice with two to five unique keys and an answer among them', () => {
    const content = validateQuestionContent('MULTIPLE_CHOICE', {
      choices: choices(['A', 'B', 'C', 'D']),
      answer: { key: 'B' },
    })

    expect(content).toEqual({
      choices: choices(['A', 'B', 'C', 'D']),
      answer: { key: 'B' },
    })
  })

  it.each([
    ['one choice', ['A']],
    ['six choices', ['A', 'B', 'C', 'D', 'E', 'F']],
    ['duplicate keys', ['A', 'A', 'B']],
  ])('refuses multiple choice with %s', (_name, keys) => {
    expect(() =>
      validateQuestionContent('MULTIPLE_CHOICE', {
        choices: choices(keys),
        answer: { key: 'A' },
      }),
    ).toThrow(BadRequestException)
  })

  it('refuses an answer key that is not one of the choices', () => {
    expect(() =>
      validateQuestionContent('MULTIPLE_CHOICE', {
        choices: choices(['A', 'B']),
        answer: { key: 'C' },
      }),
    ).toThrow('Kunci jawaban harus salah satu pilihan')
  })

  it('accepts multiple response with every key among the choices', () => {
    expect(
      validateQuestionContent('MULTIPLE_RESPONSE', {
        choices: choices(['A', 'B', 'C']),
        answer: { keys: ['A', 'C'] },
      }),
    ).toEqual({
      choices: choices(['A', 'B', 'C']),
      answer: { keys: ['A', 'C'] },
    })
  })

  it('refuses multiple response with no key or a key outside the choices', () => {
    expect(() =>
      validateQuestionContent('MULTIPLE_RESPONSE', {
        choices: choices(['A', 'B']),
        answer: { keys: [] },
      }),
    ).toThrow(BadRequestException)
    expect(() =>
      validateQuestionContent('MULTIPLE_RESPONSE', {
        choices: choices(['A', 'B']),
        answer: { keys: ['A', 'D'] },
      }),
    ).toThrow('Kunci jawaban harus salah satu pilihan')
  })

  it('accepts true/false with a boolean answer', () => {
    expect(
      validateQuestionContent('TRUE_FALSE', { answer: { value: false } }),
    ).toEqual({ answer: { value: false } })
    expect(() =>
      validateQuestionContent('TRUE_FALSE', { answer: { value: 'ya' } }),
    ).toThrow(BadRequestException)
  })

  it('needs at least one non-empty accepted answer for a short answer', () => {
    expect(
      validateQuestionContent('SHORT_ANSWER', {
        answer: {
          accepted: ['Jakarta', 'DKI Jakarta'],
          ignoreCase: true,
          ignoreHarakat: false,
        },
      }),
    ).toEqual({
      answer: {
        accepted: ['Jakarta', 'DKI Jakarta'],
        ignoreCase: true,
        ignoreHarakat: false,
      },
    })
    expect(() =>
      validateQuestionContent('SHORT_ANSWER', {
        answer: { accepted: ['  '], ignoreCase: true, ignoreHarakat: false },
      }),
    ).toThrow('Isian singkat butuh minimal satu jawaban benar')
  })

  it('accepts an essay with or without a scoring guide', () => {
    expect(validateQuestionContent('ESSAY', { guideHtml: null })).toEqual({
      guideHtml: null,
    })
    expect(
      validateQuestionContent('ESSAY', {
        guideHtml: '<p>Poin 1: definisi</p>',
      }),
    ).toEqual({ guideHtml: '<p>Poin 1: definisi</p>' })
  })

  it('refuses content shaped for another type', () => {
    expect(() =>
      validateQuestionContent('ESSAY', { answer: { value: true } }),
    ).toThrow(BadRequestException)
    expect(() =>
      validateQuestionContent('TRUE_FALSE', { guideHtml: null }),
    ).toThrow(BadRequestException)
  })
})
