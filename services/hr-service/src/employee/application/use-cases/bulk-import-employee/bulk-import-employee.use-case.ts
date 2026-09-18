import { BadRequestException, Injectable } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.js'
import { ExcelEmployeeParser } from '../../../domain/repositories/employee-excel-parser.interface.js'
import { BulkImportEmployeeRowDto } from '../../../presentation/http/dto/request/bulk-import-employee.dto.js'
import {
  BulkImportEmployeeRowResultDto,
  BulkImportEmployeesResponseDto,
} from '../../../presentation/http/dto/response/bulk-import-employee-response.dto.js'
import { resolveOnceByKey } from '../../../../shared/utils/resolve-once-by-key.helper.js'

@Injectable()
export class BulkImportEmployeesUseCase {
  constructor(
    private readonly employeeRepository: IEmployeeRepository,
    private readonly excelParser: ExcelEmployeeParser,
  ) {}

  async execute(buffer: Buffer): Promise<BulkImportEmployeesResponseDto> {
    const rawRows = await this.excelParser.parse(buffer)

    if (rawRows.length === 0) {
      throw new BadRequestException('Import file is empty or missing headers')
    }

    const dtos = rawRows.map((row) =>
      plainToInstance(BulkImportEmployeeRowDto, row),
    )

    const employmentTypeByCode = await resolveOnceByKey(
      dtos.map((d) => d.employmentTypeCode),
      (code) => this.employeeRepository.resolveEmploymentTypeId(code),
    )

    const results: BulkImportEmployeeRowResultDto[] = []
    const seenIdentifier = new Map<string, number>()
    const seenNip = new Map<string, number>()
    const seenNuptk = new Map<string, number>()
    const seenNik = new Map<string, number>()

    for (let i = 0; i < dtos.length; i++) {
      const rowNumber = i + 2
      const dto = dtos[i]

      let fileDuplicateUsername: number | undefined
      if (dto.identifier) {
        const firstRow = seenIdentifier.get(dto.identifier)
        if (firstRow !== undefined) {
          fileDuplicateUsername = firstRow
        } else {
          seenIdentifier.set(dto.identifier, rowNumber)
        }
      }

      let fileDuplicateConflict: {
        label: string
        value: string
        firstRow: number
      } | null = null
      for (const [label, value, seenMap] of [
        ['NIP', dto.nip, seenNip],
        ['NUPTK', dto.nuptk, seenNuptk],
        ['NIK', dto.nik, seenNik],
      ] as const) {
        if (!value) continue
        const firstRow = seenMap.get(value)
        if (firstRow !== undefined) {
          fileDuplicateConflict ??= { label, value, firstRow }
        } else {
          seenMap.set(value, rowNumber)
        }
      }

      const errors = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: false,
      })

      if (errors.length > 0) {
        const messages = errors
          .map((e) => Object.values(e.constraints ?? {}).join(', '))
          .join('; ')

        results.push({
          row: rowNumber,
          status: 'FAILED',
          identifier: dto.identifier,
          data: dto,
          error: `Validation failed: ${messages}`,
        })
        continue
      }

      if (fileDuplicateUsername !== undefined) {
        results.push({
          row: rowNumber,
          status: 'FAILED',
          identifier: dto.identifier,
          data: dto,
          error: `Username "${dto.identifier}" is duplicated in this file (row ${fileDuplicateUsername})`,
        })
        continue
      }

      if (fileDuplicateConflict) {
        results.push({
          row: rowNumber,
          status: 'CONFLICT',
          identifier: dto.identifier,
          data: dto,
          error: `${fileDuplicateConflict.label} "${fileDuplicateConflict.value}" is duplicated in this file (row ${fileDuplicateConflict.firstRow})`,
        })
        continue
      }

      const [existingUser, existingProfile, existingNip, existingNuptk] =
        await Promise.all([
          dto.identifier
            ? this.employeeRepository.findUserByIdentifier(dto.identifier)
            : null,
          dto.nik ? this.employeeRepository.findProfileByNik(dto.nik) : null,
          dto.nip ? this.employeeRepository.findByNip(dto.nip) : null,
          dto.nuptk ? this.employeeRepository.findByNuptk(dto.nuptk) : null,
        ])

      let existingEmployeeByNik: { id: string } | null = null
      if (existingProfile) {
        existingEmployeeByNik = await this.employeeRepository.findByUserId(
          existingProfile.userId,
        )
      }

      const existingEmployee =
        existingNip ?? existingNuptk ?? existingEmployeeByNik

      if (existingEmployee) {
        const conflictLabel = existingNip
          ? `NIP "${dto.nip}"`
          : existingNuptk
            ? `NUPTK "${dto.nuptk}"`
            : `NIK "${dto.nik}"`

        results.push({
          row: rowNumber,
          status: 'CONFLICT',
          identifier: dto.identifier,
          existingId: existingEmployee.id,
          data: dto,
          error: `${conflictLabel} matches existing employee (ID: ${existingEmployee.id})`,
        })
        continue
      }

      if (existingUser) {
        results.push({
          row: rowNumber,
          status: 'FAILED',
          identifier: dto.identifier,
          data: dto,
          error: `Identifier "${dto.identifier}" is already registered to another account`,
        })
        continue
      }

      if (existingProfile) {
        results.push({
          row: rowNumber,
          status: 'FAILED',
          identifier: dto.identifier,
          data: dto,
          error: `NIK "${dto.nik}" is already registered to another account`,
        })
        continue
      }

      if (
        dto.employmentTypeCode &&
        !employmentTypeByCode.get(dto.employmentTypeCode)
      ) {
        results.push({
          row: rowNumber,
          status: 'FAILED',
          identifier: dto.identifier,
          data: dto,
          error: `Employment type with code "${dto.employmentTypeCode}" not found`,
        })
        continue
      }

      results.push({
        row: rowNumber,
        status: 'SUCCESS',
        identifier: dto.identifier,
        data: dto,
      })
    }

    const success = results.filter((r) => r.status === 'SUCCESS').length
    const conflict = results.filter((r) => r.status === 'CONFLICT').length
    const failed = results.filter((r) => r.status === 'FAILED').length

    return {
      total: results.length,
      success,
      conflict,
      failed,
      results,
    }
  }
}
