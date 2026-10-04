import { ApiProperty } from '@nestjs/swagger'
import type { AdmissionBankAccountEntity } from '../../../../domain/entities/admission-bank-account.entity.js'

export class AdmissionBankAccountResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  bankName!: string

  @ApiProperty({ type: String })
  accountNumber!: string

  @ApiProperty({ type: String })
  accountHolder!: string

  @ApiProperty({ type: Number })
  sortOrder!: number

  @ApiProperty({ type: Boolean })
  isActive!: boolean

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string

  static fromDomain(
    domain: AdmissionBankAccountEntity,
  ): AdmissionBankAccountResponseDto {
    const dto = new AdmissionBankAccountResponseDto()
    dto.id = domain.id
    dto.bankName = domain.bankName
    dto.accountNumber = domain.accountNumber
    dto.accountHolder = domain.accountHolder
    dto.sortOrder = domain.sortOrder
    dto.isActive = domain.isActive
    dto.createdAt = domain.createdAt.toISOString()
    dto.updatedAt = domain.updatedAt.toISOString()
    return dto
  }
}

export class AdmissionBankAccountListResponseDto {
  @ApiProperty({ type: () => [AdmissionBankAccountResponseDto] })
  data!: AdmissionBankAccountResponseDto[]

  static fromDomain(
    rows: AdmissionBankAccountEntity[],
  ): AdmissionBankAccountListResponseDto {
    const dto = new AdmissionBankAccountListResponseDto()
    dto.data = rows.map((row) =>
      AdmissionBankAccountResponseDto.fromDomain(row),
    )
    return dto
  }
}
