import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseWordHtml, parseWordQuestions } from './word-question.parser.js'

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

describe('parseWordHtml', () => {
  it('reads lowercase choices and keys', () => {
    const result = parseWordHtml(
      '<p>1. Ibu kota Indonesia?</p><p>a. Jakarta</p><p>b. Bandung</p><p>Kunci: b</p>',
    )

    expect(result.errors).toEqual([])
    expect(result.questions[0]).toMatchObject({
      type: 'MULTIPLE_CHOICE',
      content: {
        choices: [
          { key: 'A', html: '<p dir="auto">Jakarta</p>' },
          { key: 'B', html: '<p dir="auto">Bandung</p>' },
        ],
        answer: { key: 'B' },
      },
    })
  })

  it('reads choices that Word lettered automatically as a nested list', () => {
    const result = parseWordHtml(
      '<ol><li>Ibu kota Indonesia?<ol><li>Jakarta</li><li>Bandung</li></ol></li>' +
        '<li>Ibu kota Jawa Barat?<ol><li>Bandung</li><li>Surabaya</li></ol></li></ol>' +
        '<p>Kunci: A</p>',
    )

    expect(result.errors).toEqual([])
    expect(result.questions).toHaveLength(2)
    expect(result.questions[0]?.bodyHtml).toBe(
      '<p dir="auto">Ibu kota Indonesia?</p>',
    )
    expect(result.questions[0]?.content).toMatchObject({
      choices: [
        { key: 'A', html: '<p dir="auto">Jakarta</p>' },
        { key: 'B', html: '<p dir="auto">Bandung</p>' },
      ],
    })
    expect(result.questions[1]?.content).toMatchObject({
      choices: [{ key: 'A' }, { key: 'B' }],
    })
  })

  it('starts a new question at each typed number, even for essays', () => {
    const result = parseWordHtml(
      '<p>1. Jelaskan arti sabar.</p><p>2. Jelaskan arti syukur.</p>',
    )

    expect(result.questions.map((q) => [q.row, q.type])).toEqual([
      [1, 'ESSAY'],
      [2, 'ESSAY'],
    ])
  })

  it('reports a question whose choices cannot be read instead of guessing', () => {
    const result = parseWordHtml(
      '<p>1. Soal</p><p>A. satu</p><p>C. tiga</p><p>Kunci: A</p>' +
        '<p>2. Soal lain</p><p>a) hanya satu</p><p>Kunci: a</p>',
    )

    expect(result.questions).toEqual([])
    expect(result.errors).toEqual([
      {
        row: 1,
        reason: 'Pilihan jawaban harus berurutan A, B, C dan seterusnya',
      },
      {
        row: 2,
        reason: 'Pilihan jawaban harus berurutan A, B, C dan seterusnya',
      },
    ])
  })
})
