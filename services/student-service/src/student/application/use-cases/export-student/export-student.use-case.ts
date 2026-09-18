import { Injectable } from '@nestjs/common'
import ExcelJS from 'exceljs'
import { ExportStudentQueryInput } from './export-student.input.js'
import { IStudentRepository } from '../../../domain/repositories/student.repository.js'
import { mapStudentToExportRow } from '../../../constants/student-export-columns.js'
import type { ExcelRow } from '../../../../shared/domain/types/exceljs.type.js'

@Injectable()
export class ExportStudentsUseCase {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async execute(filters: ExportStudentQueryInput): Promise<Buffer> {
    const students = await this.studentRepository.findAllForExport(filters)
    const rows = students.map(mapStudentToExportRow)
    return this.buildExcel(rows, 'Data Siswa')
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
        NIS: '',
        NISN: '',
        Nama: '',
        NIK: '',
        'Jenis Kelamin': '',
        'Tempat Lahir': '',
        'Tanggal Lahir': '',
        Email: '',
        Telepon: '',
        Tingkat: '',
        Kelas: '',
        Identifier: '',
        Password: '',
      },
    ]

    const activeLevels = await this.studentRepository.getActiveGradeLevels()
    const levelsFormula =
      activeLevels.length > 0 ? `"${activeLevels.join(',')}"` : '"7,8,9"'
    const sampleLevel = activeLevels.length > 0 ? activeLevels[0] : 7

    const activeClassrooms =
      await this.studentRepository.getActiveClassroomCodes()
    const classroomsFormula =
      activeClassrooms.length > 0 ? `"${activeClassrooms.join(',')}"` : '""'
    const sampleClassroom =
      activeClassrooms.length > 0 ? activeClassrooms[0] : ''

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Template Import Siswa')

    const keys = Object.keys(headers[0])
    worksheet.columns = keys.map((key) => ({
      header: key,
      key,
      width: 20,
    }))
    worksheet.addRows(headers)

    const row2 = worksheet.getRow(2)
    row2.getCell('Jenis Kelamin').value = 'L'
    row2.getCell('Tanggal Lahir').value = '2010-01-01'
    row2.getCell('Tingkat').value = sampleLevel
    row2.getCell('Kelas').value = sampleClassroom

    worksheet.dataValidations.add('E2:E1000', {
      type: 'list',
      allowBlank: true,
      formulae: ['"L,P"'],
      showErrorMessage: true,
      errorTitle: 'Pilihan Tidak Valid',
      error: 'Silakan pilih L (Laki-laki) atau P (Perempuan).',
    })

    worksheet.dataValidations.add('J2:J1000', {
      type: 'list',
      allowBlank: true,
      formulae: [levelsFormula],
      showErrorMessage: true,
      errorTitle: 'Tingkat Tidak Valid',
      error: 'Select a school level that exists and is active',
    })

    if (activeClassrooms.length > 0) {
      worksheet.dataValidations.add('K2:K1000', {
        type: 'list',
        allowBlank: true,
        formulae: [classroomsFormula],
        showErrorMessage: true,
        errorTitle: 'Kelas Tidak Valid',
        error: 'Select a classroom code that exists and is active',
      })
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(arrayBuffer)
  }
}
