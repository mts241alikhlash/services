import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseWordQuestions } from './word-question.parser.js'

const fixture = readFileSync(
  join(process.cwd(), 'test', 'fixtures', 'import', 'questions.docx'),
)

describe('parseWordQuestions', () => {
  it('reads numbered questions with choices, keys, types, points and math', async () => {
    const result = await parseWordQuestions(fixture, () =>
      Promise.resolve('file-1'),
    )

    expect(result.errors).toEqual([])
    expect(result.questions.map((q) => [q.row, q.type, q.points])).toEqual([
      [1, 'MULTIPLE_CHOICE', 1],
      [2, 'MULTIPLE_CHOICE', 1],
      [3, 'SHORT_ANSWER', 2],
      [4, 'ESSAY', 1],
    ])
    expect(result.questions[0]).toMatchObject({
      bodyHtml:
        '<p dir="auto">Berapa hasil <span data-latex="2+3">2+3</span>?</p>',
      content: {
        choices: [
          { key: 'A', html: '<p dir="auto">4</p>' },
          { key: 'B', html: '<p dir="auto">5</p>' },
          { key: 'C', html: '<p dir="auto">6</p>' },
        ],
        answer: { key: 'B' },
      },
    })
  })

  it('stores each image through the handler and references it by data-file-id', async () => {
    const saved: { size: number; contentType: string }[] = []

    const result = await parseWordQuestions(fixture, (content, contentType) => {
      saved.push({ size: content.length, contentType })
      return Promise.resolve('image-id-7')
    })

    expect(saved).toHaveLength(1)
    expect(saved[0].contentType).toBe('image/png')
    expect(result.questions[1].bodyHtml).toContain(
      '<img data-file-id="image-id-7" />',
    )
  })

  it('keeps Arabic with harakat and reads several accepted answers', async () => {
    const result = await parseWordQuestions(fixture, () => Promise.resolve('x'))

    expect(result.questions[2].bodyHtml).toBe(
      '<p dir="auto">مَا مَعْنَى كِتَابٌ؟</p>',
    )
    expect(result.questions[2].content).toMatchObject({
      answer: { accepted: ['كِتَابٌ', 'buku'] },
    })
  })

  it('reports an unreadable document', async () => {
    await expect(
      parseWordQuestions(Buffer.from('bukan docx'), () => Promise.resolve('x')),
    ).rejects.toThrow('Berkas Word tidak bisa dibaca')
  })
})
