import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsUUID } from 'class-validator'

export class ImportQuestionsDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() subjectId!: string
  @ApiProperty({ format: 'uuid' }) @IsUUID() gradeId!: string
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  authorEmployeeId?: string
}

export class ImportTemplateQueryDto {
  @ApiProperty({ enum: ['xlsx', 'docx'] })
  @IsIn(['xlsx', 'docx'])
  format!: 'xlsx' | 'docx'
}

export class ImportErrorDto {
  @ApiProperty() row!: number
  @ApiProperty() reason!: string
}

export class ImportResultDto {
  @ApiProperty() created!: number
  @ApiProperty({ type: [String] }) questionIds!: string[]
  @ApiProperty({ type: () => [ImportErrorDto] }) errors!: ImportErrorDto[]

  static fromDomain(domain: {
    created: number
    questionIds: string[]
    errors: { row: number; reason: string }[]
  }): ImportResultDto {
    const dto = new ImportResultDto()
    dto.created = domain.created
    dto.questionIds = domain.questionIds
    dto.errors = domain.errors.map((error) => {
      const row = new ImportErrorDto()
      row.row = error.row
      row.reason = error.reason
      return row
    })
    return dto
  }
}
