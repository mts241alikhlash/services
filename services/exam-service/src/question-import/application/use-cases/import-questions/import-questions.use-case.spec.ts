import {
  BadRequestException,
  ForbiddenException,
  PayloadTooLargeException,
} from '@nestjs/common'
import ExcelJS from 'exceljs'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  FakeExamFileRepository,
  FakeExamFileStorage,
} from '../../../../exam-file/application/exam-file.fakes.fake.js'
import { UploadExamFileUseCase } from '../../../../exam-file/application/use-cases/upload-exam-file/upload-exam-file.use-case.js'
import { CreateQuestionUseCase } from '../../../../question/application/use-cases/create-question/create-question.use-case.js'
import {
  FakeQuestionRepository,
  MATH_7,
  TEACHER,
  buildTeacherScope,
} from '../../../../question/application/question.repository.fake.js'
import { ImportQuestionsUseCase } from './import-questions.use-case.js'

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
const pg = (n: number, kunci = 'B') => [
  n,
  'PG',
  `Soal ${n}`,
  'satu',
  'dua',
  'tiga',
  null,
  null,
  kunci,
  null,
  null,
]

async function xlsx(rows: (string | number | null)[][]) {
  const book = new ExcelJS.Workbook()
  const sheet = book.addWorksheet('Soal')
  sheet.addRow(HEADERS)
  rows.forEach((row) => sheet.addRow(row))
  return Buffer.from(await book.xlsx.writeBuffer())
}

function build(pairs = [MATH_7]) {
  const questions = new FakeQuestionRepository()
  const files = new FakeExamFileRepository()
  const storage = new FakeExamFileStorage()
  const { scope, employees } = buildTeacherScope({ employeeId: 'emp-1', pairs })
  const useCase = new ImportQuestionsUseCase(
    scope,
    new CreateQuestionUseCase(questions, scope, employees),
    new UploadExamFileUseCase(files, storage),
  )
  return { questions, files, storage, useCase }
}

const input = (buffer: Buffer, fileName = 'soal.xlsx') => ({
  buffer,
  size: buffer.length,
  fileName,
  ...MATH_7,
})

describe('ImportQuestionsUseCase', () => {
  it('creates a draft for each good row', async () => {
    const { questions, useCase } = build()

    const result = await useCase.execute(
      TEACHER,
      input(await xlsx([1, 2, 3, 4, 5].map((n) => pg(n)))),
    )

    expect(result.created).toBe(5)
    expect(result.errors).toEqual([])
    expect(result.questionIds).toHaveLength(5)
    expect(
      [...questions.questions.values()].every((q) => q.status === 'DRAFT'),
    ).toBe(true)
    expect([...questions.questions.values()][0]?.authorEmployeeId).toBe('emp-1')
  })

  it('reports a key outside the choices by sheet row and still creates the rest', async () => {
    const { questions, useCase } = build()

    const result = await useCase.execute(
      TEACHER,
      input(await xlsx([pg(1), pg(2, 'F'), pg(3), pg(4), pg(5)])),
    )

    expect(result.errors).toEqual([
      { row: 3, reason: 'Kunci jawaban harus salah satu pilihan' },
    ])
    expect(result.created).toBe(4)
    expect(questions.questions.size).toBe(4)
  })

  it('keeps Arabic with harakat and turns $x^2$ into a math span', async () => {
    const { questions, useCase } = build()
    const arabic = 'مَا مَعْنَى كِتَابٌ؟'

    await useCase.execute(
      TEACHER,
      input(
        await xlsx([
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
            null,
            null,
          ],
          [
            2,
            'Uraian',
            'Sederhanakan $x^2$',
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
      ),
    )

    const bodies = [...questions.questions.values()].map(
      (q) => q.current.bodyHtml,
    )
    expect(bodies[0]).toBe(`<p dir="auto">${arabic}</p>`)
    expect(bodies[1]).toBe(
      '<p dir="auto">Sederhanakan <span data-latex="x^2">x^2</span></p>',
    )
  })

  it('stores a Word image as an exam file and references it by data-file-id', async () => {
    const { questions, files, useCase } = build()
    const docx = readFileSync(
      join(process.cwd(), 'test', 'fixtures', 'import', 'questions.docx'),
    )

    const result = await useCase.execute(TEACHER, input(docx, 'soal.docx'))

    expect(result).toMatchObject({ created: 4, errors: [] })
    expect(files.files.size).toBe(1)
    const [fileId] = [...files.files.keys()]
    const withImage = [...questions.questions.values()].find((q) =>
      q.current.bodyHtml.includes('<img'),
    )
    expect(withImage?.current.bodyHtml).toContain(`data-file-id="${fileId}"`)
  })

  it('refuses a subject and grade the teacher does not teach before reading the file', async () => {
    const { questions, useCase } = build([])

    await expect(
      useCase.execute(TEACHER, input(await xlsx([pg(1)]))),
    ).rejects.toThrow(ForbiddenException)
    expect(questions.questions.size).toBe(0)
  })

  it('refuses the wrong extension, a fake workbook and an oversized file', async () => {
    const { useCase } = build()
    const real = await xlsx([pg(1)])

    await expect(
      useCase.execute(TEACHER, input(real, 'soal.csv')),
    ).rejects.toThrow(new BadRequestException('Berkas harus .xlsx atau .docx'))
    await expect(
      useCase.execute(TEACHER, input(Buffer.from('a,b,c'), 'soal.xlsx')),
    ).rejects.toThrow(
      new BadRequestException('Isi berkas tidak sesuai dengan jenisnya'),
    )
    await expect(
      useCase.execute(TEACHER, {
        ...input(real),
        size: 10 * 1024 * 1024 + 1,
      }),
    ).rejects.toThrow(
      new PayloadTooLargeException('Ukuran berkas maksimal 10 MB'),
    )
  })

  it('refuses a sheet with more than 500 questions', async () => {
    const { useCase } = build()
    const rows = Array.from({ length: 501 }, (_, i) => pg(i + 1))

    await expect(
      useCase.execute(TEACHER, input(await xlsx(rows))),
    ).rejects.toThrow(new BadRequestException('Maksimal 500 soal per berkas'))
  })
})
