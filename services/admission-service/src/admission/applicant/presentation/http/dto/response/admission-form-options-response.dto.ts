import { ApiProperty } from '@nestjs/swagger'
import type { FormOptions } from '../../../../application/use-cases/get-form-options/get-form-options.use-case.js'

export class AdmissionFormOptionResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  name!: string
}

export class AdmissionFormBankAccountResponseDto {
  @ApiProperty({ type: String })
  id!: string

  @ApiProperty({ type: String })
  bankName!: string

  @ApiProperty({ type: String })
  accountNumber!: string

  @ApiProperty({ type: String })
  accountHolder!: string
}

export class AdmissionFormOptionsResponseDto {
  @ApiProperty({ type: () => [AdmissionFormBankAccountResponseDto] })
  bankAccounts!: AdmissionFormBankAccountResponseDto[]

  @ApiProperty({ type: () => [AdmissionFormOptionResponseDto] })
  religions!: AdmissionFormOptionResponseDto[]

  @ApiProperty({ type: () => [AdmissionFormOptionResponseDto] })
  occupations!: AdmissionFormOptionResponseDto[]

  @ApiProperty({ type: () => [AdmissionFormOptionResponseDto] })
  educations!: AdmissionFormOptionResponseDto[]

  @ApiProperty({ type: () => [AdmissionFormOptionResponseDto] })
  incomeRanges!: AdmissionFormOptionResponseDto[]

  @ApiProperty({ type: () => [AdmissionFormOptionResponseDto] })
  financingSources!: AdmissionFormOptionResponseDto[]

  @ApiProperty({ type: () => [AdmissionFormOptionResponseDto] })
  disabilityTypes!: AdmissionFormOptionResponseDto[]

  @ApiProperty({ type: () => [AdmissionFormOptionResponseDto] })
  specialNeeds!: AdmissionFormOptionResponseDto[]

  @ApiProperty({ type: () => [AdmissionFormOptionResponseDto] })
  studentResidences!: AdmissionFormOptionResponseDto[]

  @ApiProperty({ type: () => [AdmissionFormOptionResponseDto] })
  parentResidences!: AdmissionFormOptionResponseDto[]

  @ApiProperty({ type: () => [AdmissionFormOptionResponseDto] })
  transportations!: AdmissionFormOptionResponseDto[]

  @ApiProperty({ type: () => [AdmissionFormOptionResponseDto] })
  travelDistances!: AdmissionFormOptionResponseDto[]

  @ApiProperty({ type: () => [AdmissionFormOptionResponseDto] })
  travelTimes!: AdmissionFormOptionResponseDto[]

  @ApiProperty({ type: () => [AdmissionFormOptionResponseDto] })
  parentLifeStatuses!: AdmissionFormOptionResponseDto[]

  @ApiProperty({ type: () => [AdmissionFormOptionResponseDto] })
  domiciles!: AdmissionFormOptionResponseDto[]

  @ApiProperty({ type: () => [AdmissionFormOptionResponseDto] })
  scholarshipCategories!: AdmissionFormOptionResponseDto[]

  @ApiProperty({ type: () => [AdmissionFormOptionResponseDto] })
  scholarshipProviderTypes!: AdmissionFormOptionResponseDto[]

  @ApiProperty({ type: () => [AdmissionFormOptionResponseDto] })
  competitionFields!: AdmissionFormOptionResponseDto[]

  @ApiProperty({ type: () => [AdmissionFormOptionResponseDto] })
  competitionLevels!: AdmissionFormOptionResponseDto[]

  static fromDomain(domain: FormOptions): AdmissionFormOptionsResponseDto {
    const { bankAccounts, ...lists } = domain
    const dto = new AdmissionFormOptionsResponseDto()
    for (const key of Object.keys(lists) as (keyof typeof lists)[]) {
      dto[key] = lists[key].map(({ id, name }) => ({ id, name }))
    }
    dto.bankAccounts = bankAccounts.map((account) => ({ ...account }))
    return dto
  }
}
