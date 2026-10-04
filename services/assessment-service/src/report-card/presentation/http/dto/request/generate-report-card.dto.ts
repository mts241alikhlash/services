import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator'

export class GenerateReportCardDto {
  @IsUUID()
  enrollmentId!: string

  @IsOptional()
  @IsString()
  employeeNote?: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  rank?: number

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean
}
