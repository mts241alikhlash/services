import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class CancelAdmissionPaymentDto {
  @ApiProperty({ example: 'Nominal tidak sesuai mutasi bank' })
  @IsString()
  @IsNotEmpty()
  note: string
}
