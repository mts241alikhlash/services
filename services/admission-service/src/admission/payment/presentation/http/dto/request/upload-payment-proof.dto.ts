import { ApiProperty } from '@nestjs/swagger'
import {
  IsDateString,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator'

export class UploadPaymentProofDto {
  @ApiProperty({ example: 'BSI' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  bankName: string

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  bankAccountId: string

  @ApiProperty({ example: 'Ahmad Fauzi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  senderAccountName: string

  @ApiProperty({ format: 'date' })
  @IsDateString()
  transferDate: string
}
