import { BadRequestException, HttpException } from '@nestjs/common'
import ExcelJS from 'exceljs'
import { Readable } from 'node:stream'
import type { Choice } from '../../../question/domain/value-objects/question-content.js'
import { IMPORT_MAX_QUESTIONS } from '../../domain/import-limits.js'
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

function readColumns(row: ExcelJS.Row): Map<string, number> {
  const columns = new Map<string, number>()
  row.eachCell((cell, column) => {
    columns.set(cell.text.trim().toLowerCase(), column)
  })
  return columns
}

function parseRow(
  row: ExcelJS.Row,
  columns: Map<string, number>,
): ParsedQuestion | null {
  const text = (column: string): string => {
    const index = columns.get(column)
    return index === undefined ? '' : row.getCell(index).text.trim()
  }

  const typeName = text('jenis')
  const body = text('soal')
  if (typeName === '' && body === '') return null

  const type = Object.hasOwn(JENIS_TYPES, typeName.toLowerCase())
    ? JENIS_TYPES[typeName.toLowerCase() as keyof typeof JENIS_TYPES]
    : undefined
  if (type === undefined) throw new ImportRowError('Jenis soal tidak dikenal')

  const choices: Choice[] = CHOICE_COLUMNS.flatMap((key) => {
    const value = text(key.toLowerCase())
    return value === '' ? [] : [{ key, html: textToHtml(value) }]
  })
  return {
    row: row.number,
    type,
    bodyHtml: textToHtml(body),
    content: buildImportContent(type, {
      choices,
      key: text('kunci'),
      ignoreHarakat: text('abaikan harakat').toLowerCase() === 'ya',
    }),
    points: parsePoints(text('poin')),
  }
}

export async function parseExcelQuestions(
  buffer: Buffer,
): Promise<ParseResult> {
  const reader = new ExcelJS.stream.xlsx.WorkbookReader(Readable.from(buffer), {
    worksheets: 'emit',
    sharedStrings: 'cache',
    hyperlinks: 'ignore',
    styles: 'ignore',
    entries: 'ignore',
  })

  const result: ParseResult = { questions: [], errors: [] }
  let columns: Map<string, number> | null = null
  let counted = 0
  let sawSheet = false

  try {
    for await (const sheet of reader) {
      sawSheet = true
      for await (const row of sheet as AsyncIterable<ExcelJS.Row>) {
        if (row.number === 1) {
          columns = readColumns(row)
          if (!columns.has('jenis') || !columns.has('soal')) {
            throw new BadRequestException(
              'Kolom Jenis dan Soal tidak ditemukan',
            )
          }
          continue
        }
        if (columns === null) continue

        try {
          const question = parseRow(row, columns)
          if (question === null) continue
          counted += 1
          result.questions.push(question)
        } catch (error) {
          if (!(error instanceof ImportRowError)) throw error
          counted += 1
          result.errors.push({ row: row.number, reason: error.message })
        }
        if (counted > IMPORT_MAX_QUESTIONS) {
          throw new BadRequestException('Maksimal 500 soal per berkas')
        }
      }
      break
    }
  } catch (error) {
    if (error instanceof HttpException) throw error
    throw new BadRequestException('Berkas Excel tidak bisa dibaca')
  }

  if (!sawSheet)
    throw new BadRequestException('Berkas Excel tidak punya lembar')
  if (columns === null) {
    throw new BadRequestException('Kolom Jenis dan Soal tidak ditemukan')
  }
  return result
}
