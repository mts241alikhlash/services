import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  PayloadTooLargeException,
} from '@nestjs/common'
import ExcelJS from 'exceljs'
import JSZip from 'jszip'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  FakeExamFileRepository,
  FakeExamFileStorage,
} from '../../../../exam-file/application/exam-file.fakes.fake.js'
import { UploadExamFileUseCase } from '../../../../exam-file/application/use-cases/upload-exam-file/upload-exam-file.use-case.js'
import type { ExamPackageDetail } from '../../../../exam-package/domain/entities/exam-package.entity.js'
import { FakeExamPackageRepository } from '../../../../exam-package/application/exam-package.repository.fake.js'
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

const PACKAGE_ID = '33333333-3333-4333-8333-333333333333'

function build(pairs = [MATH_7]) {
  const questions = new FakeQuestionRepository()
  const packages = new FakeExamPackageRepository(questions)
  const now = new Date()
  packages.packages.set(PACKAGE_ID, {
    id: PACKAGE_ID,
    title: 'UTS Matematika',
    ...MATH_7,
    status: 'DRAFT',
    lockedAt: null,
    createdById: TEACHER.id,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    items: [],
  })
  const files = new FakeExamFileRepository()
  const storage = new FakeExamFileStorage()
  const { scope, employees } = buildTeacherScope({ employeeId: 'emp-1', pairs })
  const useCase = new ImportQuestionsUseCase(
    scope,
    packages,
    employees,
    new UploadExamFileUseCase(files, storage),
  )
  return { questions, packages, files, storage, useCase }
}

const input = (buffer: Buffer, fileName = 'soal.xlsx') => ({
  buffer,
  size: buffer.length,
  fileName,
  packageId: PACKAGE_ID,
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

  it('stores nothing executable from a hostile Word file or sheet', async () => {
    const { questions, useCase } = build()
    const hostile = '<script>alert(1)</script><img src=x onerror=alert(2)>'
    const zip = new JSZip()
    zip.file(
      '[Content_Types].xml',
      '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    )
    zip.file(
      '_rels/.rels',
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    )
    zip.file(
      'word/_rels/document.xml.rels',
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="javascript:alert(3)" TargetMode="External"/></Relationships>',
    )
    zip.file(
      'word/document.xml',
      '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body><w:p><w:r><w:t>1. Klik </w:t></w:r><w:hyperlink r:id="rId9"><w:r><w:t>di sini</w:t></w:r></w:hyperlink><w:r><w:t xml:space="preserve"> ' +
        hostile.replace(/</gu, '&lt;').replace(/>/gu, '&gt;') +
        '</w:t></w:r></w:p></w:body></w:document>',
    )
    const docx = await zip.generateAsync({ type: 'nodebuffer' })
    const sheet = await xlsx([
      [1, 'Uraian', hostile, null, null, null, null, null, hostile, null, null],
    ])

    await useCase.execute(TEACHER, input(docx, 'soal.docx'))
    await useCase.execute(TEACHER, input(sheet))

    const stored = [...questions.questions.values()].flatMap((q) => [
      q.current.bodyHtml,
      JSON.stringify(q.current.content),
    ])
    expect(stored.join('')).toContain('di sini')
    for (const html of stored) {
      expect(html).not.toMatch(/<script|<a[\s>]|<img|\shref=|javascript:/iu)
    }
  })

  it('reports points outside the allowed range as a row error', async () => {
    const { questions, useCase } = build()
    const rows = [
      pg(1),
      [2, 'PG', 'Soal 2', 'a', 'b', null, null, null, 'A', null, 1000],
    ]

    const result = await useCase.execute(TEACHER, input(await xlsx(rows)))

    expect(result.errors).toEqual([
      { row: 3, reason: 'Poin harus antara 0,25 dan 100' },
    ])
    expect(questions.questions.size).toBe(1)
  })

  describe('images in a Word file', () => {
    const png = (seed: number) =>
      Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        Buffer.from([seed % 256, Math.floor(seed / 256)]),
      ])

    async function docxWithImages(images: Buffer[], refs: number[]) {
      const zip = new JSZip()
      const media = images
        .map(
          (_image, index) =>
            `<Relationship Id="rI${index}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/i${index}.png"/>`,
        )
        .join('')
      zip.file(
        '[Content_Types].xml',
        '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
      )
      zip.file(
        '_rels/.rels',
        '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
      )
      zip.file(
        'word/_rels/document.xml.rels',
        `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${media}</Relationships>`,
      )
      images.forEach((image, index) =>
        zip.file(`word/media/i${index}.png`, image),
      )
      const drawing = (index: number) =>
        `<w:p><w:r><w:drawing><wp:inline><wp:extent cx="9525" cy="9525"/><wp:docPr id="${index}" name="g"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="g"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rI${index}"/></pic:blipFill><pic:spPr/></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`
      zip.file(
        'word/document.xml',
        `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body><w:p><w:r><w:t>1. Lihat gambar</w:t></w:r></w:p>${refs.map(drawing).join('')}<w:p><w:r><w:t>Jenis: Uraian</w:t></w:r></w:p></w:body></w:document>`,
      )
      return zip.generateAsync({ type: 'nodebuffer' })
    }

    it('stores the same picture once however often it appears', async () => {
      const { files, useCase } = build()
      const docx = await docxWithImages([png(1)], [0, 0, 0, 0, 0])

      const result = await useCase.execute(TEACHER, input(docx, 'soal.docx'))

      expect(result.created).toBe(1)
      expect(files.files.size).toBe(1)
    })

    it('refuses a picture that is not JPG, PNG or WebP instead of dropping it', async () => {
      const { questions, useCase } = build()
      const docx = await docxWithImages([Buffer.from('GIF89a......')], [0])

      await expect(
        useCase.execute(TEACHER, input(docx, 'soal.docx')),
      ).rejects.toThrow(
        new BadRequestException('Gambar harus JPG, PNG, atau WebP'),
      )
      expect(questions.questions.size).toBe(0)
    })

    it('refuses more than 100 different pictures and stores none of the rest', async () => {
      const { files, questions, useCase } = build()
      const images = Array.from({ length: 101 }, (_, i) => png(i))
      const docx = await docxWithImages(
        images,
        images.map((_, i) => i),
      )

      await expect(
        useCase.execute(TEACHER, input(docx, 'soal.docx')),
      ).rejects.toThrow(
        new BadRequestException('Maksimal 100 gambar per berkas'),
      )
      expect(files.files.size).toBeLessThanOrEqual(100)
      expect(questions.questions.size).toBe(0)
    })
  })

  it('puts every good row in the package, in file order', async () => {
    const { packages, questions, useCase } = build()

    const result = await useCase.execute(
      TEACHER,
      input(await xlsx([pg(1), pg(2), pg(3)])),
    )

    const stored = packages.packages.get(PACKAGE_ID)
    expect(stored?.items.map((item) => item.position)).toEqual([1, 2, 3])
    expect(stored?.items.map((item) => item.questionId)).toEqual(
      result.questionIds,
    )
    expect(
      [...questions.questions.values()].every(
        (q) => q.packageId === PACKAGE_ID && q.subjectId === 'math',
      ),
    ).toBe(true)
  })

  it('imports into an approved package and sets it back to draft', async () => {
    const { packages, useCase } = build()
    packages.packages.set(PACKAGE_ID, {
      ...(packages.packages.get(PACKAGE_ID) as ExamPackageDetail),
      status: 'APPROVED',
    })

    await useCase.execute(TEACHER, input(await xlsx([pg(1)])))

    expect(packages.packages.get(PACKAGE_ID)?.status).toBe('DRAFT')
  })

  it('refuses a submitted package and imports nothing', async () => {
    const { packages, questions, useCase } = build()
    packages.packages.set(PACKAGE_ID, {
      ...(packages.packages.get(PACKAGE_ID) as ExamPackageDetail),
      status: 'SUBMITTED',
    })

    await expect(
      useCase.execute(TEACHER, input(await xlsx([pg(1)]))),
    ).rejects.toThrow(ConflictException)
    expect(questions.questions.size).toBe(0)
  })

  it('refuses a package that does not exist', async () => {
    const { useCase } = build()

    await expect(
      useCase.execute(TEACHER, {
        ...input(await xlsx([pg(1)])),
        packageId: '00000000-0000-4000-8000-000000000000',
      }),
    ).rejects.toThrow('Paket tidak ditemukan')
  })
})
