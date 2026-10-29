import type { QuestionContent } from '../../../question/domain/value-objects/question-content.js'
import { buildPaper, type PaperSource } from './build-paper.policy.js'

const choices = (['A', 'B', 'C', 'D', 'E'] as const).map((key) => ({
  key,
  html: `<p>${key}</p>`,
}))

const mc: QuestionContent = { choices, answer: { key: 'C' } }

const source = (
  id: string,
  overrides: Partial<PaperSource> = {},
): PaperSource => ({
  questionId: id,
  type: 'MULTIPLE_CHOICE',
  bodyHtml: `<p>Soal ${id}</p>`,
  content: mc,
  points: 2,
  ...overrides,
})

const many = Array.from({ length: 12 }, (_, index) => source(`q${index}`))

describe('buildPaper', () => {
  it('numbers the questions from one in the shuffled order', () => {
    const paper = buildPaper(many, 'seed-a')

    expect(paper.map((question) => question.number)).toEqual(
      Array.from({ length: 12 }, (_, index) => index + 1),
    )
    expect(new Set(paper.map((question) => question.questionId)).size).toBe(12)
  })

  describe('type order', () => {
    const typed = (id: string, type: PaperSource['type']) =>
      source(id, { type })
    const mixed = [
      ...Array.from({ length: 4 }, (_, i) => typed(`essay${i}`, 'ESSAY')),
      ...Array.from({ length: 4 }, (_, i) =>
        typed(`short${i}`, 'SHORT_ANSWER'),
      ),
      ...Array.from({ length: 4 }, (_, i) => typed(`tf${i}`, 'TRUE_FALSE')),
      ...Array.from({ length: 4 }, (_, i) =>
        typed(`multi${i}`, 'MULTIPLE_RESPONSE'),
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        typed(`mc${i}`, 'MULTIPLE_CHOICE'),
      ),
    ]

    it('puts multiple choice first, then true/false, short answer and essay', () => {
      const paper = buildPaper(mixed, 'seed-a')

      expect(paper.map((question) => question.type)).toEqual([
        ...Array(4).fill('MULTIPLE_CHOICE'),
        ...Array(4).fill('MULTIPLE_RESPONSE'),
        ...Array(4).fill('TRUE_FALSE'),
        ...Array(4).fill('SHORT_ANSWER'),
        ...Array(4).fill('ESSAY'),
      ])
      expect(paper.map((question) => question.number)).toEqual(
        Array.from({ length: 20 }, (_, index) => index + 1),
      )
    })

    it('still shuffles the questions inside each type', () => {
      const orders = new Set(
        ['seed-a', 'seed-b', 'seed-c', 'seed-d'].map((seed) =>
          buildPaper(mixed, seed)
            .filter((question) => question.type === 'MULTIPLE_CHOICE')
            .map((question) => question.questionId)
            .join(),
        ),
      )

      expect(orders.size).toBeGreaterThan(1)
    })

    it('leaves no gap when a type is missing', () => {
      const paper = buildPaper(
        [typed('e1', 'ESSAY'), typed('m1', 'MULTIPLE_CHOICE')],
        'seed-a',
      )

      expect(paper.map((question) => question.questionId)).toEqual(['m1', 'e1'])
      expect(paper.map((question) => question.number)).toEqual([1, 2])
    })
  })

  it('gives the same paper for the same seed and another for another seed', () => {
    expect(buildPaper(many, 'seed-a')).toEqual(buildPaper(many, 'seed-a'))
    expect(buildPaper(many, 'seed-a').map((q) => q.questionId)).not.toEqual(
      buildPaper(many, 'seed-b').map((q) => q.questionId),
    )
  })

  it('shuffles the choices but keeps each key with its text', () => {
    const paper = buildPaper(many, 'seed-a')
    const orders = new Set(
      paper.map((question) => question.choices?.map((c) => c.key).join('')),
    )

    expect(orders.size).toBeGreaterThan(1)
    for (const question of paper) {
      for (const choice of question.choices ?? []) {
        expect(choice.html).toBe(`<p>${choice.key}</p>`)
      }
    }
  })

  it('never carries an answer key', () => {
    const json = JSON.stringify(
      buildPaper(
        [
          source('a'),
          source('b', {
            type: 'MULTIPLE_RESPONSE',
            content: { choices, answer: { keys: ['A', 'B'] } },
          }),
          source('c', {
            type: 'TRUE_FALSE',
            content: { answer: { value: true } },
          }),
          source('d', {
            type: 'SHORT_ANSWER',
            content: {
              answer: {
                accepted: ['rahasia'],
                ignoreCase: true,
                ignoreHarakat: false,
              },
            },
          }),
          source('e', {
            type: 'ESSAY',
            content: { guideHtml: '<p>panduan</p>' },
          }),
        ],
        'seed-a',
      ),
    )

    expect(json).not.toContain('answer')
    expect(json).not.toContain('rahasia')
    expect(json).not.toContain('panduan')
    expect(json).not.toContain('guideHtml')
  })

  it('offers choices only for the choice types', () => {
    const paper = buildPaper(
      [
        source('a'),
        source('b', {
          type: 'TRUE_FALSE',
          content: { answer: { value: false } },
        }),
        source('c', { type: 'ESSAY', content: { guideHtml: null } }),
      ],
      'seed-a',
    )

    const byId = Object.fromEntries(paper.map((q) => [q.questionId, q]))
    expect(byId.a.choices).toHaveLength(5)
    expect(byId.b.choices).toBeNull()
    expect(byId.c.choices).toBeNull()
  })

  it('keeps the body and the points', () => {
    const [question] = buildPaper([source('a', { points: 3.5 })], 'seed-a')

    expect(question.bodyHtml).toBe('<p>Soal a</p>')
    expect(question.points).toBe(3.5)
  })
})
