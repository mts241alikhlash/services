import { BadRequestException } from '@nestjs/common'
import { prepareQuestion } from './prepare-question.policy.js'

describe('prepareQuestion', () => {
  it('sanitizes the body and every choice, and validates the content', () => {
    const result = prepareQuestion(
      'MULTIPLE_CHOICE',
      '<p onclick="x()">Soal<script>alert(1)</script></p>',
      {
        choices: [
          { key: 'A', html: '<p>Satu</p><script>x</script>' },
          { key: 'B', html: '<p onmouseover="x()">Dua</p>' },
        ],
        answer: { key: 'B' },
      },
    )

    expect(result).toEqual({
      bodyHtml: '<p>Soal</p>',
      content: {
        choices: [
          { key: 'A', html: '<p>Satu</p>' },
          { key: 'B', html: '<p>Dua</p>' },
        ],
        answer: { key: 'B' },
      },
    })
  })

  it('refuses a body that is empty once sanitized', () => {
    expect(() =>
      prepareQuestion('TRUE_FALSE', '<script>x</script>', {
        answer: { value: true },
      }),
    ).toThrow(new BadRequestException('Isi soal wajib diisi'))
  })

  it('refuses a choice that is empty once sanitized', () => {
    expect(() =>
      prepareQuestion('MULTIPLE_CHOICE', '<p>Soal</p>', {
        choices: [
          { key: 'A', html: '<script>x</script>' },
          { key: 'B', html: '<p>Dua</p>' },
        ],
        answer: { key: 'B' },
      }),
    ).toThrow(new BadRequestException('Isi pilihan jawaban wajib diisi'))
  })

  it('sanitizes an essay guide and turns a blank guide into null', () => {
    expect(
      prepareQuestion('ESSAY', '<p>Jelaskan</p>', {
        guideHtml: '<p onclick="x()">Poin</p>',
      }).content,
    ).toEqual({ guideHtml: '<p>Poin</p>' })
    expect(
      prepareQuestion('ESSAY', '<p>Jelaskan</p>', { guideHtml: '  ' }).content,
    ).toEqual({ guideHtml: null })
  })
})
