import { Injectable } from '@nestjs/common'
import ExcelJS from 'exceljs'
import JSZip from 'jszip'

export type TemplateFormat = 'xlsx' | 'docx'

export interface ImportTemplate {
  buffer: Buffer
  fileName: string
  contentType: string
}

const EXCEL_HEADERS = [
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

const EXCEL_EXAMPLES: (string | number | null)[][] = [
  [1, 'PG', 'Berapa hasil $2+3$?', '4', '5', '6', '7', null, 'B', null, 1],
  [
    2,
    'PG Kompleks',
    'Pilih bilangan genap.',
    '2',
    '3',
    '4',
    '5',
    null,
    'A,C',
    null,
    2,
  ],
  [
    3,
    'Benar/Salah',
    'Bumi berbentuk bulat.',
    null,
    null,
    null,
    null,
    null,
    'Benar',
    null,
    1,
  ],
  [
    4,
    'Isian',
    'Ibu kota Indonesia adalah ...',
    null,
    null,
    null,
    null,
    null,
    'Jakarta|DKI Jakarta',
    'Tidak',
    1,
  ],
  [
    5,
    'Uraian',
    'Jelaskan arti gotong royong.',
    null,
    null,
    null,
    null,
    null,
    'Kerja sama dan saling membantu',
    null,
    5,
  ],
]

const EXCEL_NOTES = [
  'Satu baris satu soal. Jangan ubah judul kolom pada lembar Soal.',
  'Jenis: PG, PG Kompleks, Benar/Salah, Isian, atau Uraian.',
  'Kunci PG: satu huruf (B). PG Kompleks: beberapa huruf (A,C). Benar/Salah: Benar atau Salah.',
  'Kunci Isian: jawaban benar dipisah tanda | (Jakarta|DKI Jakarta). Kunci Uraian: pedoman penilaian (boleh kosong).',
  'Rumus matematika ditulis di antara tanda dolar, misalnya $x^2$.',
  'Abaikan harakat: Ya jika harakat Arab tidak dihitung saat menilai Isian.',
  'Gambar tidak bisa dimasukkan lewat Excel. Tambahkan gambar lewat editor soal atau berkas Word.',
  'Semua soal masuk sebagai draf dan perlu diajukan serta disetujui.',
]

const WORD_EXAMPLES = [
  '1. Berapa hasil $2+3$?',
  'A. 4',
  'B. 5',
  'C. 6',
  'D. 7',
  'Kunci: B',
  'Poin: 1',
  '2. Pilih bilangan genap.',
  'A. 2',
  'B. 3',
  'C. 4',
  'D. 5',
  'Kunci: A, C',
  'Jenis: PG Kompleks',
  '3. Bumi berbentuk bulat.',
  'Kunci: Benar',
  '4. Ibu kota Indonesia adalah ...',
  'Kunci: Jakarta|DKI Jakarta',
  '5. Jelaskan arti gotong royong.',
  'Jenis: Uraian',
]

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'

function escapeXml(text: string): string {
  return text
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
}

async function buildExcel(): Promise<Buffer> {
  const book = new ExcelJS.Workbook()
  const sheet = book.addWorksheet('Soal')
  sheet.addRow(EXCEL_HEADERS).font = { bold: true }
  EXCEL_EXAMPLES.forEach((row) => sheet.addRow(row))
  sheet.getColumn(3).width = 48
  const notes = book.addWorksheet('Petunjuk')
  EXCEL_NOTES.forEach((line) => notes.addRow([line]))
  notes.getColumn(1).width = 110
  return Buffer.from(await book.xlsx.writeBuffer())
}

async function buildWord(): Promise<Buffer> {
  const paragraphs = WORD_EXAMPLES.map(
    (line) =>
      `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`,
  ).join('')
  const zip = new JSZip()
  zip.file(
    '[Content_Types].xml',
    `${XML_HEADER}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
  )
  zip.file(
    '_rels/.rels',
    `${XML_HEADER}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
  )
  zip.file(
    'word/document.xml',
    `${XML_HEADER}<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}</w:body></w:document>`,
  )
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}

@Injectable()
export class GetImportTemplateUseCase {
  async execute(format: TemplateFormat): Promise<ImportTemplate> {
    if (format === 'xlsx') {
      return {
        buffer: await buildExcel(),
        fileName: 'template-soal.xlsx',
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    }
    return {
      buffer: await buildWord(),
      fileName: 'template-soal.docx',
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }
  }
}
