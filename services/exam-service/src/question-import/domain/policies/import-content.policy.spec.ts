import { buildImportContent, ImportRowError } from './import-content.policy.js'

const choices = [
  { key: 'A' as const, html: '<p dir="auto">4</p>' },
  { key: 'B' as const, html: '<p dir="auto">5</p>' },
]

describe('buildImportContent', () => {
  it('reads one key for multiple choice and many for multiple response', () => {
    expect(
      buildImportContent('MULTIPLE_CHOICE', { choices, key: ' b ' }),
    ).toEqual({ choices, answer: { key: 'B' } })
    expect(
      buildImportContent('MULTIPLE_RESPONSE', { choices, key: 'a, b ;a' }),
    ).toEqual({ choices, answer: { keys: ['A', 'B'] } })
  })

  it('reads Benar and Salah, in any case', () => {
    expect(
      buildImportContent('TRUE_FALSE', { choices: [], key: 'BENAR' }),
    ).toEqual({ answer: { value: true } })
    expect(
      buildImportContent('TRUE_FALSE', { choices: [], key: 'salah' }),
    ).toEqual({ answer: { value: false } })
    expect(() =>
      buildImportContent('TRUE_FALSE', { choices: [], key: 'mungkin' }),
    ).toThrow(new ImportRowError('Kunci harus Benar atau Salah'))
  })

  it('splits short answers on | and honors the harakat flag', () => {
    expect(
      buildImportContent('SHORT_ANSWER', {
        choices: [],
        key: 'كِتَابٌ | buku',
        ignoreHarakat: true,
      }),
    ).toEqual({
      answer: {
        accepted: ['كِتَابٌ', 'buku'],
        ignoreCase: true,
        ignoreHarakat: true,
      },
    })
  })

  it('turns an essay key into a scoring guide, or null', () => {
    expect(
      buildImportContent('ESSAY', { choices: [], key: 'Poin $x^2$' }),
    ).toEqual({
      guideHtml: '<p dir="auto">Poin <span data-latex="x^2">x^2</span></p>',
    })
    expect(buildImportContent('ESSAY', { choices: [], key: '' })).toEqual({
      guideHtml: null,
    })
  })

  it('leaves a missing key for the content validator to refuse', () => {
    expect(buildImportContent('MULTIPLE_CHOICE', { choices, key: '' })).toEqual(
      { choices, answer: { key: '' } },
    )
  })
})
