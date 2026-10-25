import { ApiProperty } from '@nestjs/swagger'
import type { ExamFile } from '../../../domain/entities/exam-file.entity.js'

export class ExamFileDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() mimeType!: string
  @ApiProperty() sizeBytes!: number

  static fromDomain(domain: ExamFile): ExamFileDto {
    const dto = new ExamFileDto()
    dto.id = domain.id
    dto.mimeType = domain.mimeType
    dto.sizeBytes = domain.sizeBytes
    return dto
  }
}
