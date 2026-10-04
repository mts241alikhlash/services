import { Injectable } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import {
  BulkImportRowResultDto,
  BulkImportStudentsResponseDto,
} from '../../../presentation/http/dto/response/bulk-import-student-response.dto.js'
import { BulkImportStudentRowDto } from '../../../presentation/http/dto/request/bulk-import-student.dto.js'
import { IStudentRepository } from '../../../domain/repositories/student.repository.js'
import { ExcelStudentParser } from '../../../domain/repositories/student-excel-parser.interface.js'
import { resolveOnceByKey } from '../../../../shared/utils/resolve-once-by-key.helper.js'

@Injectable()
export class BulkImportStudentsUseCase {
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly academicLookup: IAcademicLookupPort,
    private readonly excelParser: ExcelStudentParser,
  ) {}

  async execute(buffer: Buffer): Promise<BulkImportStudentsResponseDto> {
    const rows = await this.excelParser.parse(buffer)
    const dtos = rows.map((row) =>
      plainToInstance(BulkImportStudentRowDto, row),
    )

    const [gradeByLevel, classroomByCode] = await Promise.all([
      resolveOnceByKey(
        dtos.map((d) => d.grade),
        (level) => this.academicLookup.findGradeByLevel(level),
      ),
      resolveOnceByKey(
        dtos.map((d) => d.classroomCode),
        (code) => this.academicLookup.findClassroomByCode(code),
      ),
    ])

    const results: BulkImportRowResultDto[] = []
    const seen = new Map<string, number>()

    for (let i = 0; i < dtos.length; i++) {
      const rowNumber = i + 2
      const dto = dtos[i]

      let duplicate: { label: string; value: string; firstRow: number } | null =
        null
      for (const [label, value] of [
        ['NIS', dto.nis],
        ['NISN', dto.nisn],
      ] as const) {
        if (!value) continue
        const key = `${label}:${value}`
        const firstRow = seen.get(key)
        if (firstRow !== undefined) {
          duplicate ??= { label, value, firstRow }
        } else {
          seen.set(key, rowNumber)
        }
      }

      const [dupNis, dupNisn] = await Promise.all([
        dto.nis ? this.studentRepository.findByNis(dto.nis) : null,
        dto.nisn ? this.studentRepository.findByNisn(dto.nisn) : null,
      ])
      const existing = dupNis ?? dupNisn

      const errors = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: false,
      })

      if (errors.length > 0) {
        const messages = errors
          .map((e) => Object.values(e.constraints ?? {}).join(', '))
          .join('; ')

        const conflictMsg = existing
          ? `; ${dupNis ? `NIS "${dto.nis}" is already registered` : `NISN "${dto.nisn}" is already registered`}`
          : ''

        results.push({
          row: rowNumber,
          status: 'FAILED',
          identifier: dto.identifier,
          existingId: existing?.id,
          data: dto,
          error: `Validation failed: ${messages}${conflictMsg}`,
        })
        continue
      }

      if (dto.grade && !gradeByLevel.get(dto.grade)) {
        results.push({
          row: rowNumber,
          status: 'FAILED',
          identifier: dto.identifier,
          data: dto,
          error: `Tingkat ${dto.grade} not found`,
        })
        continue
      }

      if (dto.classroomCode && !classroomByCode.get(dto.classroomCode)) {
        results.push({
          row: rowNumber,
          status: 'FAILED',
          identifier: dto.identifier,
          data: dto,
          error: `Classroom with code "${dto.classroomCode}" not found`,
        })
        continue
      }

      if (existing) {
        results.push({
          row: rowNumber,
          status: 'CONFLICT',
          identifier: dto.identifier,
          existingId: existing.id,
          data: dto,
          error: dupNis
            ? `NIS "${dto.nis}" is already registered`
            : `NISN "${dto.nisn}" is already registered`,
        })
        continue
      }

      if (duplicate) {
        results.push({
          row: rowNumber,
          status: 'CONFLICT',
          identifier: dto.identifier,
          data: dto,
          error: `${duplicate.label} "${duplicate.value}" is duplicated in this file (row ${duplicate.firstRow})`,
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
    const failed = results.filter((r) => r.status === 'FAILED').length
    const conflict = results.filter((r) => r.status === 'CONFLICT').length

    return { total: results.length, success, failed, conflict, results }
  }
}
