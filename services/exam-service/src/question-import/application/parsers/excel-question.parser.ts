import { BadRequestException } from '@nestjs/common'
import ExcelJS from 'exceljs'
import type { Choice } from '../../../question/domain/value-objects/question-content.js'
import {
  JENIS_TYPES,
  type ParseResult,
  type ParsedQuestion,
} from '../../domain/parsed-question.js'
import {
  buildImportContent,
  ImportRowError,
  parsePoints,
} from '../../domain/policies/import-content.policy.js'
import { textToHtml } from '../../domain/policies/inline-latex.policy.js'

const CHOICE_COLUMNS = ['A', 'B', 'C', 'D', 'E'] as const

function headerIndexes(sheet: ExcelJS.Worksheet): Map<string, number> {
  const indexes = new Map<string, number>()
  sheet.getRow(1).eachCell((cell, column) => {
    indexes.set(cell.text.trim().toLowerCase(), column)
  })
  return indexes
}

export async function parseExcelQuestions(
  buffer: Buffer,
): Promise<ParseResult> {
  const book = new ExcelJS.Workbook()
  try {
    await book.xlsx.load(buffer as unknown as ExcelJS.Buffer)
  } catch {
    throw new BadRequestException('Berkas Excel tidak bisa dibaca')
  }

  const sheet = book.worksheets[0]
  if (!sheet) throw new BadRequestException('Berkas Excel tidak punya lembar')

  const columns = headerIndexes(sheet)
  const jenis = columns.get('jenis')
  const soal = columns.get('soal')
  if (jenis === undefined || soal === undefined) {
    throw new BadRequestException('Kolom Jenis dan Soal tidak ditemukan')
  }

  const result: ParseResult = { questions: [], errors: [] }

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber)
    const text = (column: string | number): string => {
      const index = typeof column === 'number' ? column : columns.get(column)
      return index === undefined ? '' : row.getCell(index).text.trim()
    }

    const typeName = text(jenis)
    const body = text(soal)
    if (typeName === '' && body === '') continue

    try {
      const type =
        JENIS_TYPES[typeName.toLowerCase() as keyof typeof JENIS_TYPES]
      if (type === undefined)
        throw new ImportRowError('Jenis soal tidak dikenal')

      const choices: Choice[] = CHOICE_COLUMNS.flatMap((key) => {
        const value = text(key.toLowerCase())
        return value === '' ? [] : [{ key, html: textToHtml(value) }]
      })
      const question: ParsedQuestion = {
        row: rowNumber,
        type,
        bodyHtml: textToHtml(body),
        content: buildImportContent(type, {
          choices,
          key: text('kunci'),
          ignoreHarakat: text('abaikan harakat').toLowerCase() === 'ya',
        }),
        points: parsePoints(text('poin')),
      }
      result.questions.push(question)
    } catch (error) {
      if (!(error instanceof ImportRowError)) throw error
      result.errors.push({ row: rowNumber, reason: error.message })
    }
  }

  return result
}
