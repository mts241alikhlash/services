import { ApiProperty } from '@nestjs/swagger'

export class AdmissionAttachmentResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id!: string

  static fromDomain(domain: { id: string }): AdmissionAttachmentResponseDto {
    const dto = new AdmissionAttachmentResponseDto()
    dto.id = domain.id
    return dto
  }
}
