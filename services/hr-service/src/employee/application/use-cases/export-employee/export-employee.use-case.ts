import { Injectable } from '@nestjs/common'
import ExcelJS from 'exceljs'
import { ExportEmployeeInput } from './export-employee.input.js'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'
import { mapEmployeeToExportRow } from '../../../constants/employee-export-columns.js'
import type { ExcelRow } from '../../../../shared/domain/types/exceljs.type.js'

@Injectable()
export class ExportEmployeesUseCase {
  constructor(private readonly employeeRepository: IEmployeeRepository) {}

  async execute(filters: ExportEmployeeInput): Promise<Buffer> {
    const employees = await this.employeeRepository.findAllForExport(filters)
    const rows = employees.map(mapEmployeeToExportRow)
    return this.buildExcel(rows, 'Employees')
  }

  private async buildExcel(
    rows: ExcelRow[],
    sheetName: string,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(sheetName)

    if (rows.length > 0) {
      const keys = Object.keys(rows[0])
      worksheet.columns = keys.map((key) => ({
        header: key,
        key,
        width: 20,
      }))
      worksheet.addRows(rows)
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(arrayBuffer)
  }

  async buildImportTemplate(): Promise<Buffer> {
    const headers = [
      {
        Nama: '',
        NIK: '',
        NIP: '',
        NUPTK: '',
        'Status Kepegawaian': '',
        'Jenis Kelamin': '',
        'Tempat Lahir': '',
        'Tanggal Lahir': '',
        Email: '',
        Telepon: '',
        Identifier: '',
        Password: '',
      },
    ]

    const activeCodes =
      await this.employeeRepository.getActiveEmploymentTypeCodes()
    const empFormula =
      activeCodes.length > 0
        ? `"${activeCodes.join(',')}"`
        : '"PNS,PPPK,NON_ASN"'
    const sampleEmp = activeCodes.length > 0 ? activeCodes[0] : 'NON_ASN'

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Template Import Pegawai')

    const keys = Object.keys(headers[0])
    worksheet.columns = keys.map((key) => ({
      header: key,
      key,
      width: 20,
    }))
    worksheet.addRows(headers)

    const row2 = worksheet.getRow(2)
    row2.getCell('Status Kepegawaian').value = sampleEmp
    row2.getCell('Jenis Kelamin').value = 'L'
    row2.getCell('Tanggal Lahir').value = '1990-01-01'

    worksheet.dataValidations.add('E2:E1000', {
      type: 'list',
      allowBlank: true,
      formulae: [empFormula],
      showErrorMessage: true,
      errorTitle: 'Pilihan Tidak Valid',
      error: 'Select an employment type that exists and is active',
    })

    worksheet.dataValidations.add('F2:F1000', {
      type: 'list',
      allowBlank: true,
      formulae: ['"L,P"'],
      showErrorMessage: true,
      errorTitle: 'Pilihan Tidak Valid',
      error: 'Silakan pilih L (Laki-laki) atau P (Perempuan).',
    })

    const arrayBuffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(arrayBuffer)
  }
}
