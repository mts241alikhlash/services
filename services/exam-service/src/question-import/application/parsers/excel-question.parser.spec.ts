import { BadRequestException } from '@nestjs/common'
import ExcelJS from 'exceljs'
import { parseExcelQuestions } from './excel-question.parser.js'

const HEADERS = [
  'No',
  'Jenis',
  'Soal',
  'A',
  'B',
  'C',
  'D',
  'E',
  'Kunci',
  'Abaikan harakat',
  'Poin',
]

async function workbook(rows: (string | number | null)[][], headers = HEADERS) {
  const book = new ExcelJS.Workbook()
  const sheet = book.addWorksheet('Soal')
  sheet.addRow(headers)
  rows.forEach((row) => sheet.addRow(row))
  return Buffer.from(await book.xlsx.writeBuffer())
}

describe('parseExcelQuestions', () => {
  it('reads one question of every type, numbering rows like the sheet', async () => {
    const result = await parseExcelQuestions(
      await workbook([
        [1, 'PG', 'Berapa $2+3$?', '4', '5', '6', null, null, 'B', null, 2],
        [
          2,
          'PG Kompleks',
          'Pilih bilangan genap',
          '2',
          '3',
          '4',
          null,
          null,
          'A,C',
          null,
          null,
        ],
        [
          3,
          'Benar/Salah',
          'Bumi bulat',
          null,
          null,
          null,
          null,
          null,
          'Benar',
          null,
          null,
        ],
        [
          4,
          'Isian',
          'Ibu kota Indonesia',
          null,
          null,
          null,
          null,
          null,
          'Jakarta|DKI Jakarta',
          'Tidak',
          null,
        ],
        [
          5,
          'Uraian',
          'Jelaskan gotong royong',
          null,
          null,
          null,
          null,
          null,
          'Poin: kerja sama',
          null,
          5,
        ],
      ]),
    )

    expect(result.errors).toEqual([])
    expect(result.questions.map((q) => [q.row, q.type, q.points])).toEqual([
      [2, 'MULTIPLE_CHOICE', 2],
      [3, 'MULTIPLE_RESPONSE', 1],
      [4, 'TRUE_FALSE', 1],
      [5, 'SHORT_ANSWER', 1],
      [6, 'ESSAY', 5],
    ])
    expect(result.questions[0]).toMatchObject({
      bodyHtml: '<p dir="auto">Berapa <span data-latex="2+3">2+3</span>?</p>',
      content: {
        choices: [
          { key: 'A', html: '<p dir="auto">4</p>' },
          { key: 'B', html: '<p dir="auto">5</p>' },
          { key: 'C', html: '<p dir="auto">6</p>' },
        ],
        answer: { key: 'B' },
      },
    })
    expect(result.questions[3].content).toEqual({
      answer: {
        accepted: ['Jakarta', 'DKI Jakarta'],
        ignoreCase: true,
        ignoreHarakat: false,
      },
    })
  })

  it('keeps Arabic text with harakat byte for byte and reads Abaikan harakat', async () => {
    const arabic = 'مَا مَعْنَى كِتَابٌ؟'
    const result = await parseExcelQuestions(
      await workbook([
        [
          1,
          'Isian',
          arabic,
          null,
          null,
          null,
          null,
          null,
          'كِتَابٌ',
          'Ya',
          null,
        ],
      ]),
    )

    expect(result.questions[0].bodyHtml).toBe(`<p dir="auto">${arabic}</p>`)
    expect(result.questions[0].content).toMatchObject({
      answer: { accepted: ['كِتَابٌ'], ignoreHarakat: true },
    })
  })

  it('reports a bad row and still reads the others', async () => {
    const result = await parseExcelQuestions(
      await workbook([
        [1, 'PG', 'Soal 1', 'a', 'b', null, null, null, 'A', null, null],
        [
          2,
          'Pilihan ganda',
          'Soal 2',
          'a',
          'b',
          null,
          null,
          null,
          'A',
          null,
          null,
        ],
        [
          3,
          'Benar/Salah',
          'Soal 3',
          null,
          null,
          null,
          null,
          null,
          'Mungkin',
          null,
          null,
        ],
        [4, 'PG', 'Soal 4', 'a', 'b', null, null, null, 'B', null, 'banyak'],
        [5, 'PG', 'Soal 5', 'a', 'b', null, null, null, 'B', null, null],
      ]),
    )

    expect(result.errors).toEqual([
      { row: 3, reason: 'Jenis soal tidak dikenal' },
      { row: 4, reason: 'Kunci harus Benar atau Salah' },
      { row: 5, reason: 'Poin harus berupa angka' },
    ])
    expect(result.questions.map((q) => q.row)).toEqual([2, 6])
  })

  it('skips blank rows and asks for the Jenis and Soal columns', async () => {
    const result = await parseExcelQuestions(
      await workbook([
        [null, null, null, null, null, null, null, null, null, null, null],
        [
          1,
          'Uraian',
          'Jelaskan',
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        ],
      ]),
    )
    expect(result.questions.map((q) => q.row)).toEqual([3])

    await expect(
      parseExcelQuestions(await workbook([], ['No', 'Pertanyaan'])),
    ).rejects.toThrow(
      new BadRequestException('Kolom Jenis dan Soal tidak ditemukan'),
    )
  })

  it('refuses a file that is not a workbook', async () => {
    await expect(
      parseExcelQuestions(Buffer.from('bukan xlsx')),
    ).rejects.toThrow(new BadRequestException('Berkas Excel tidak bisa dibaca'))
  })

  it('stops reading and refuses a sheet past 500 questions', async () => {
    const rows = Array.from({ length: 501 }, (_, i) => [
      i + 1,
      'Uraian',
      `Soal ${i + 1}`,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ])

    await expect(parseExcelQuestions(await workbook(rows))).rejects.toThrow(
      new BadRequestException('Maksimal 500 soal per berkas'),
    )
  })

  it('reads only the first sheet', async () => {
    const book = new ExcelJS.Workbook()
    const first = book.addWorksheet('Soal')
    first.addRow(HEADERS)
    first.addRow([
      1,
      'Uraian',
      'Jelaskan',
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ])
    const second = book.addWorksheet('Lain')
    second.addRow(['x'])
    const result = await parseExcelQuestions(
      Buffer.from(await book.xlsx.writeBuffer()),
    )

    expect(result.questions.map((q) => q.row)).toEqual([2])
  })
})
