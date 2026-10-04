import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator'

export class CreateAdmissionBankAccountDto {
  @ApiProperty({ example: 'BSI' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  bankName!: string

  @ApiProperty({ example: '7123456789' })
  @Matches(/^\d{5,30}$/, { message: 'accountNumber must be 5 to 30 digits' })
  accountNumber!: string

  @ApiProperty({ example: 'MTs Al-Ikhlash' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  accountHolder!: string

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

export class UpdateAdmissionBankAccountDto extends PartialType(
  CreateAdmissionBankAccountDto,
) {}
