import { ApiProperty } from '@nestjs/swagger'
import { RolloverResult } from '../../../../domain/repositories/rollover.repository.js'

export class RolloverCategoryResultDto {
  @ApiProperty() created: number
  @ApiProperty() skipped: number
}

export class RolloverSummaryDto {
  @ApiProperty() classrooms: RolloverCategoryResultDto
  @ApiProperty() enrollments: RolloverCategoryResultDto
  @ApiProperty() supervisors: RolloverCategoryResultDto
  @ApiProperty() teachingAssignments: RolloverCategoryResultDto
  @ApiProperty() schedules: RolloverCategoryResultDto

  static fromResult(result: RolloverResult): RolloverSummaryDto {
    const dto = new RolloverSummaryDto()
    dto.classrooms = result.classrooms
    dto.enrollments = result.enrollments
    dto.supervisors = result.supervisors
    dto.teachingAssignments = result.teachingAssignments
    dto.schedules = result.schedules
    return dto
  }
}
