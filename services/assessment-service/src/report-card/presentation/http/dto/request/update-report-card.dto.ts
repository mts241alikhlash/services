import { IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class UpdateReportCardDto {
  @IsOptional()
  @IsString()
  employeeNote?: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  rank?: number
}
