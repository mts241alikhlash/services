import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'
import { UploadPaymentProofDto } from './upload-payment-proof.dto.js'

export class AddAdmissionPaymentDto extends UploadPaymentProofDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  applicationId: string
}
