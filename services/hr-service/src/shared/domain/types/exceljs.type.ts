import ExcelJS from 'exceljs'

declare module 'exceljs' {
  interface Worksheet {
    dataValidations: {
      add(range: string, validation: ExcelJS.DataValidation): void
    }
  }
}

export type ExcelRow = Record<string, ExcelJS.CellValue>
